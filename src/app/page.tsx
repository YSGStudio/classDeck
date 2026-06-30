"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDirectory } from "@/context/DirectoryContext";
import { DirectoryGate } from "@/components/DirectoryGate";
import { AppHeader } from "@/components/AppHeader";
import { MonthCalendar } from "@/components/MonthCalendar";
import { PresentModeLink } from "@/components/PresentModeLink";
import { LessonSummary } from "@/lib/types";
import { buildLessonId, deleteLesson, listLessons, readLesson, writeLesson } from "@/lib/fsLessons";

function LessonRow({
  lesson,
  isEditing,
  onStartEdit,
  onStopEdit,
  onTitleChange,
  onTitleBlur,
  onDateChange,
  actions,
}: {
  lesson: LessonSummary;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onTitleChange: (title: string) => void;
  onTitleBlur: () => void;
  onDateChange: (date: string) => void;
  actions: React.ReactNode;
}) {
  if (isEditing) {
    return (
      <li className="flex items-center justify-between gap-3 rounded-lg border border-slate-300 bg-slate-100 px-4 py-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <input
            value={lesson.title}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={onTitleBlur}
            autoFocus
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm font-medium text-slate-900 focus:border-slate-500 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <input
              type="date"
              value={lesson.lessonDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="rounded-md border border-slate-300 px-1.5 py-0.5 text-xs focus:border-slate-500 focus:outline-none"
            />
            <span>
              · {lesson.subject || "과목 없음"} · {lesson.grade || "학년 없음"}
            </span>
          </div>
        </div>
        <button onClick={onStopEdit} className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-200">
          완료
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-100 px-4 py-3">
      <Link href={`/lessons/${encodeURIComponent(lesson.id)}`} className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">{lesson.title}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {lesson.lessonDate} · {lesson.subject || "과목 없음"} · {lesson.grade || "학년 없음"}
        </p>
      </Link>
      <div className="flex items-center gap-1 text-xs">
        <button onClick={onStartEdit} className="rounded px-2 py-1 text-slate-600 hover:bg-slate-200">
          수정
        </button>
        {actions}
      </div>
    </li>
  );
}

function todaySeoul(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

function Dashboard() {
  const { directoryHandle } = useDirectory();
  const router = useRouter();
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(() => todaySeoul());
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!directoryHandle) return;
    setLoading(true);
    const list = await listLessons(directoryHandle);
    setLessons(list);
    setLoading(false);
  }, [directoryHandle]);

  useEffect(() => {
    void (async () => {
      await refresh();
    })();
  }, [refresh]);

  const datesWithLessons = useMemo(() => new Set(lessons.map((l) => l.lessonDate)), [lessons]);
  const visibleLessons = selectedDate ? lessons.filter((l) => l.lessonDate === selectedDate) : lessons;

  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    return lessons.filter((l) => l.title.includes(q) || l.achievementStandard.includes(q));
  }, [lessons, searchQuery]);

  function updateLessonField(id: string, patch: Partial<LessonSummary>) {
    setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  async function persistLessonField(id: string, patch: { title?: string; lessonDate?: string }) {
    if (!directoryHandle) return;
    const full = await readLesson(directoryHandle, id);
    if (!full) return;
    await writeLesson(directoryHandle, { ...full, ...patch, updatedAt: new Date().toISOString() });
  }

  function handleTitleChange(id: string, title: string) {
    updateLessonField(id, { title });
  }

  function handleTitleBlur(id: string, title: string) {
    void persistLessonField(id, { title });
  }

  function handleDateChange(id: string, lessonDate: string) {
    if (!lessonDate) return;
    updateLessonField(id, { lessonDate });
    void persistLessonField(id, { lessonDate });
  }

  async function copyLessonToDate(id: string, lessonDate: string, suffix: string) {
    if (!directoryHandle) return;
    const original = await readLesson(directoryHandle, id);
    if (!original) return;
    const newTitle = `${original.title} ${suffix}`;
    const newId = buildLessonId(lessonDate, original.subject, newTitle);
    const now = new Date().toISOString();
    await writeLesson(directoryHandle, {
      ...original,
      id: newId,
      lessonDate,
      title: newTitle,
      feedback: "",
      createdAt: now,
      updatedAt: now,
    });
    await refresh();
    return newId;
  }

  async function handleDuplicate(id: string) {
    const today = todaySeoul();
    const newId = await copyLessonToDate(id, today, "(복제)");
    if (newId) router.push(`/lessons/${encodeURIComponent(newId)}`);
  }

  async function handleCopyToToday(id: string) {
    const today = todaySeoul();
    await copyLessonToDate(id, today, "(복사)");
    setSelectedDate(today);
  }

  async function handleDelete(id: string) {
    if (!directoryHandle) return;
    if (!confirm("이 수업을 삭제할까요? 자료 파일도 함께 삭제됩니다.")) return;
    await deleteLesson(directoryHandle, id);
    await refresh();
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">수업 목록</h1>
        <Link
          href="/lessons/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + 새 수업
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <MonthCalendar
            datesWithLessons={datesWithLessons}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">수업 찾기</h2>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="제목 또는 성취기준으로 검색"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
            {searchQuery.trim() && (
              <ul className="mt-3 space-y-2">
                {searchResults.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">검색 결과가 없습니다.</p>
                ) : (
                  searchResults.map((lesson) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      isEditing={editingId === lesson.id}
                      onStartEdit={() => setEditingId(lesson.id)}
                      onStopEdit={() => setEditingId(null)}
                      onTitleChange={(title) => handleTitleChange(lesson.id, title)}
                      onTitleBlur={() => handleTitleBlur(lesson.id, lesson.title)}
                      onDateChange={(date) => handleDateChange(lesson.id, date)}
                      actions={
                        <button
                          onClick={() => handleCopyToToday(lesson.id)}
                          className="rounded px-2 py-1 text-slate-600 hover:bg-slate-200"
                        >
                          복사
                        </button>
                      }
                    />
                  ))
                )}
              </ul>
            )}
          </div>
        </div>

        <div>
          {selectedDate && (
            <div className="mb-2 flex items-center justify-between px-1 text-sm text-slate-500">
              <span>{selectedDate} 수업</span>
              <button onClick={() => setSelectedDate(null)} className="text-slate-400 hover:text-slate-700">
                전체 보기
              </button>
            </div>
          )}
          {loading ? (
            <p className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-10 text-center text-sm text-slate-400">
              불러오는 중…
            </p>
          ) : visibleLessons.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-10 text-center text-sm text-slate-400">
              아직 등록된 수업이 없습니다. 새 수업을 만들어 보세요.
            </p>
          ) : (
            <ul className="space-y-2">
              {visibleLessons.map((lesson) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  isEditing={editingId === lesson.id}
                  onStartEdit={() => setEditingId(lesson.id)}
                  onStopEdit={() => setEditingId(null)}
                  onTitleChange={(title) => handleTitleChange(lesson.id, title)}
                  onTitleBlur={() => handleTitleBlur(lesson.id, lesson.title)}
                  onDateChange={(date) => handleDateChange(lesson.id, date)}
                  actions={
                    <>
                      <PresentModeLink
                        lessonId={lesson.id}
                        className="rounded px-2 py-1 text-slate-600 hover:bg-slate-200"
                      >
                        발표
                      </PresentModeLink>
                      <button
                        onClick={() => handleDuplicate(lesson.id)}
                        className="rounded px-2 py-1 text-slate-600 hover:bg-slate-200"
                      >
                        복제
                      </button>
                      <button
                        onClick={() => handleDelete(lesson.id)}
                        className="rounded px-2 py-1 text-red-500 hover:bg-red-100"
                      >
                        삭제
                      </button>
                    </>
                  }
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <>
      <AppHeader />
      <DirectoryGate>
        <Dashboard />
      </DirectoryGate>
    </>
  );
}
