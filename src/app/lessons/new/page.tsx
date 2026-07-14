"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { DirectoryGate } from "@/components/DirectoryGate";
import { useDirectory } from "@/context/DirectoryContext";
import { buildLessonId, readLesson, writeLesson } from "@/lib/fsLessons";
import { createEmptyLesson } from "@/lib/types";
import { todaySeoul } from "@/lib/date";
import { clearPendingAchievementStandard, peekPendingAchievementStandard } from "@/lib/pendingAchievementStandard";

const SUBJECT_OPTIONS = ["국어", "영어", "수학", "사회", "과학", "음악", "미술", "체육", "실과", "창체", "도덕"];
const GRADE_OPTIONS = ["1학년", "2학년", "3학년", "4학년", "5학년", "6학년"];

function NewLessonForm() {
  const { directoryHandle } = useDirectory();
  const router = useRouter();
  const [lessonDate, setLessonDate] = useState(() => todaySeoul());
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingStandard, setPendingStandard] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => setPendingStandard(peekPendingAchievementStandard()));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!directoryHandle) return;
    if (!title.trim()) {
      setError("수업 제목을 입력해 주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const id = buildLessonId(lessonDate, subject, title);
      const existing = await readLesson(directoryHandle, id);
      if (existing) {
        setError("같은 날짜·과목·제목의 수업이 이미 있습니다. 제목을 다르게 입력해 주세요.");
        setSaving(false);
        return;
      }
      const lesson = createEmptyLesson({ id, lessonDate, title, subject, grade });
      if (pendingStandard) {
        lesson.achievementStandard = pendingStandard;
        clearPendingAchievementStandard();
      }
      await writeLesson(directoryHandle, lesson);
      router.push(`/lessons/${encodeURIComponent(id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "수업을 생성하지 못했습니다.");
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
      <h1 className="text-xl font-bold text-slate-900">새 수업 만들기</h1>
      {pendingStandard && (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span className="font-medium text-slate-700">선택한 성취기준이 함께 저장됩니다.</span>
          <p className="mt-1 text-slate-500">{pendingStandard}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">날짜</label>
          <input
            type="date"
            value={lessonDate}
            onChange={(e) => setLessonDate(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 빛의 굴절"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">과목</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="">선택</option>
              {SUBJECT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">학년</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="">선택</option>
              {GRADE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "생성 중…" : "수업 생성하고 준비모드로 이동"}
        </button>
      </form>
    </main>
  );
}

export default function NewLessonPage() {
  return (
    <>
      <AppHeader />
      <DirectoryGate>
        <NewLessonForm />
      </DirectoryGate>
    </>
  );
}
