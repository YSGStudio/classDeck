"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDirectory } from "@/context/DirectoryContext";
import { DirectoryGate } from "@/components/DirectoryGate";
import { AppHeader } from "@/components/AppHeader";
import { MonthCalendar } from "@/components/MonthCalendar";
import { LessonSummary } from "@/lib/types";
import { buildLessonId, deleteLesson, listLessons, readLesson, writeLesson } from "@/lib/fsLessons";

function Dashboard() {
  const { directoryHandle } = useDirectory();
  const router = useRouter();
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  async function handleDuplicate(id: string) {
    if (!directoryHandle) return;
    const original = await readLesson(directoryHandle, id);
    if (!original) return;
    const today = new Date().toISOString().slice(0, 10);
    const newTitle = `${original.title} (복제)`;
    const newId = buildLessonId(today, original.subject, newTitle);
    const now = new Date().toISOString();
    await writeLesson(directoryHandle, {
      ...original,
      id: newId,
      lessonDate: today,
      title: newTitle,
      feedback: "",
      createdAt: now,
      updatedAt: now,
    });
    await refresh();
    router.push(`/lessons/${encodeURIComponent(newId)}`);
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
        <MonthCalendar
          datesWithLessons={datesWithLessons}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

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
                <li
                  key={lesson.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-100 px-4 py-3"
                >
                  <Link href={`/lessons/${encodeURIComponent(lesson.id)}`} className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{lesson.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {lesson.lessonDate} · {lesson.subject || "과목 없음"} · {lesson.grade || "학년 없음"}
                    </p>
                  </Link>
                  <div className="flex items-center gap-1 text-xs">
                    <Link
                      href={`/lessons/${encodeURIComponent(lesson.id)}/present`}
                      className="rounded px-2 py-1 text-slate-600 hover:bg-slate-200"
                    >
                      발표
                    </Link>
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
                  </div>
                </li>
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
