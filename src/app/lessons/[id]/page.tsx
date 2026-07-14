"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { DirectoryGate } from "@/components/DirectoryGate";
import { RubricEditor } from "@/components/RubricEditor";
import { ActivityEditor } from "@/components/ActivityEditor";
import { MaterialsEditor } from "@/components/MaterialsEditor";
import { PresentModeLink } from "@/components/PresentModeLink";
import { useDirectory } from "@/context/DirectoryContext";
import { readLesson, writeLesson } from "@/lib/fsLessons";
import { Lesson } from "@/lib/types";
import { ACTIVITY_KIND_LABELS } from "@/lib/activityKinds";

const AUTOSAVE_DELAY_MS = 1200;

function LessonEditor({ id }: { id: string }) {
  const { directoryHandle } = useDirectory();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const lessonRef = useRef<Lesson | null>(null);

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
    setDirty(true);
  }

  async function handleSave() {
    if (!directoryHandle || !lessonRef.current) return;
    setSaving(true);
    const updated = { ...lessonRef.current, updatedAt: new Date().toISOString() };
    await writeLesson(directoryHandle, updated);
    setLesson(updated);
    setDirty(false);
    setSavedAt(new Date().toLocaleTimeString("ko-KR"));
    setSaving(false);
  }

  useEffect(() => {
    lessonRef.current = lesson;
  }, [lesson]);

  // 입력이 멈춘 뒤 잠시 후 자동 저장 — 발표모드로 바로 넘어가도 최신 내용이 반영되도록 함.
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      void handleSave();
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, lesson]);

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
      <div className="print:hidden">
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
          <PresentModeLink
            lessonId={lesson.id}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            발표모드
          </PresentModeLink>
          <button
            onClick={() => window.print()}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            인쇄
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        {saving ? "저장 중…" : dirty ? "변경사항이 있습니다. 잠시 후 자동 저장됩니다." : savedAt ? `${savedAt}에 자동 저장됨` : ""}
      </p>

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

        <Section title="채점기준 (루브릭)">
          <RubricEditor rubrics={lesson.rubrics} onChange={(rubrics) => update("rubrics", rubrics)} />
        </Section>

        <Section title="활동">
          <ActivityEditor
            activities={lesson.activities}
            onChange={(activities) => update("activities", activities)}
          />
        </Section>

        <Section title="수업 자료">
          <MaterialsEditor
            storagePath={[lesson.id]}
            directoryHandle={directoryHandle}
            materials={lesson.materials}
            onChange={(materials) => update("materials", materials)}
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
          disabled={saving || !dirty}
          className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
      </div>

      {/* 인쇄용 뷰 — 화면에서는 숨기고 인쇄 시에만 표시. 편집 폼(textarea, 버튼)이 아닌
          내용 그대로를 줄바꿈 유지한 채 출력해 잘림 없이 결재·보관용으로 쓸 수 있게 함. */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold text-slate-900">{lesson.title || "제목 없음"}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {lesson.lessonDate} · {lesson.subject || "과목 없음"} · {lesson.grade || "학년 없음"}
        </p>

        <PrintSection title="성취기준" text={lesson.achievementStandard} />
        <PrintSection title="탐구질문" text={lesson.inquiryQuestion} />
        <PrintSection title="도달목표" text={lesson.goal} />
        <PrintSection title="수행과제" text={lesson.task} />

        {lesson.rubrics.length > 0 && (
          <PrintBlock title="채점기준 (루브릭)">
            <div className="space-y-3">
              {lesson.rubrics.map((rubric, i) => (
                <div key={i} className="break-inside-avoid rounded border border-slate-300 p-3">
                  <p className="font-semibold">{rubric.criteria}</p>
                  <p className="mt-1">상: {rubric.high}</p>
                  <p>중: {rubric.mid}</p>
                  <p>하: {rubric.low}</p>
                </div>
              ))}
            </div>
          </PrintBlock>
        )}

        {lesson.activities.length > 0 && (
          <PrintBlock title="활동">
            <div className="space-y-3">
              {lesson.activities
                .slice()
                .sort((a, b) => a.orderNo - b.orderNo)
                .map((activity, i) => (
                  <div key={activity.id ?? i} className="break-inside-avoid rounded border border-slate-300 p-3">
                    <p className="font-semibold">
                      [{ACTIVITY_KIND_LABELS[activity.kind]}] {activity.title}
                      {activity.durationMinutes ? ` (${activity.durationMinutes}분)` : ""}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{activity.content}</p>
                  </div>
                ))}
            </div>
          </PrintBlock>
        )}

        {lesson.materials.length > 0 && (
          <PrintBlock title="수업 자료">
            <ul className="list-inside list-disc">
              {lesson.materials.map((material, i) => (
                <li key={i}>{material.title}</li>
              ))}
            </ul>
          </PrintBlock>
        )}

        <PrintSection title="수업 후 피드백" text={lesson.feedback} />
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

function PrintBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 break-inside-avoid">
      <h2 className="border-b border-slate-400 pb-1 text-sm font-bold uppercase tracking-wide text-slate-700">
        {title}
      </h2>
      <div className="mt-2 text-sm text-slate-900">{children}</div>
    </section>
  );
}

function PrintSection({ title, text }: { title: string; text: string }) {
  if (!text) return null;
  return (
    <PrintBlock title={title}>
      <p className="whitespace-pre-wrap">{text}</p>
    </PrintBlock>
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
