"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { DirectoryGate } from "@/components/DirectoryGate";
import { RubricEditor } from "@/components/RubricEditor";
import { ActivityEditor } from "@/components/ActivityEditor";
import { useDirectory } from "@/context/DirectoryContext";
import { readLesson, writeLesson } from "@/lib/fsLessons";
import { Lesson } from "@/lib/types";

function LessonEditor({ id }: { id: string }) {
  const { directoryHandle } = useDirectory();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!directoryHandle) return;
    (async () => {
      const loaded = await readLesson(directoryHandle, id);
      if (!loaded) {
        setNotFound(true);
        return;
      }
      setLesson(loaded);
    })();
  }, [directoryHandle, id]);

  function update<K extends keyof Lesson>(field: K, value: Lesson[K]) {
    setLesson((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSave() {
    if (!directoryHandle || !lesson) return;
    setSaving(true);
    const updated = { ...lesson, updatedAt: new Date().toISOString() };
    await writeLesson(directoryHandle, updated);
    setLesson(updated);
    setSavedAt(new Date().toLocaleTimeString("ko-KR"));
    setSaving(false);
  }

  if (notFound) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-slate-600">수업을 찾을 수 없습니다.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-slate-900 underline">
          대시보드로 돌아가기
        </Link>
      </main>
    );
  }

  if (!lesson || !directoryHandle) {
    return <p className="px-4 py-12 text-center text-slate-400">불러오는 중…</p>;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600">
            ← 대시보드
          </Link>
          <h1 className="text-xl font-bold text-slate-900">{lesson.title || "수업 편집"}</h1>
          <p className="text-sm text-slate-500">
            {lesson.lessonDate} · {lesson.subject || "과목 없음"} · {lesson.grade || "학년 없음"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/lessons/${encodeURIComponent(lesson.id)}/present`}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            발표모드
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
      {savedAt && <p className="mt-2 text-xs text-emerald-600">{savedAt}에 저장되었습니다.</p>}

      <div className="mt-6 space-y-8">
        <Section title="성취기준">
          <textarea
            value={lesson.achievementStandard}
            onChange={(e) => update("achievementStandard", e.target.value)}
            rows={2}
            placeholder="교육과정 성취기준을 입력하세요."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </Section>

        <Section title="탐구질문">
          <textarea
            value={lesson.inquiryQuestion}
            onChange={(e) => update("inquiryQuestion", e.target.value)}
            rows={2}
            placeholder="성취기준에서 이어지는 핵심 탐구질문을 입력하세요."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </Section>

        <Section title="채점기준 (루브릭)">
          <RubricEditor rubrics={lesson.rubrics} onChange={(rubrics) => update("rubrics", rubrics)} />
        </Section>

        <Section title="도달목표">
          <textarea
            value={lesson.goal}
            onChange={(e) => update("goal", e.target.value)}
            rows={2}
            placeholder="이 수업에서 도달할 목표를 입력하세요."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </Section>

        <Section title="수행과제">
          <textarea
            value={lesson.task}
            onChange={(e) => update("task", e.target.value)}
            rows={2}
            placeholder="학생 수행 과제를 입력하세요."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </Section>

        <Section title="활동">
          <ActivityEditor
            lessonId={lesson.id}
            directoryHandle={directoryHandle}
            activities={lesson.activities}
            onChange={(activities) => update("activities", activities)}
          />
        </Section>

        <Section title="수업 후 피드백">
          <textarea
            value={lesson.feedback}
            onChange={(e) => update("feedback", e.target.value)}
            rows={3}
            placeholder="수업 후 간단한 자기 피드백을 입력하세요."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </Section>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

export default function LessonEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <>
      <AppHeader />
      <DirectoryGate>
        <LessonEditor id={decodeURIComponent(id)} />
      </DirectoryGate>
    </>
  );
}
