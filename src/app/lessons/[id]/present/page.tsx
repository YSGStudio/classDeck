"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { DirectoryGate } from "@/components/DirectoryGate";
import { useDirectory } from "@/context/DirectoryContext";
import { readLesson, readMaterialFile } from "@/lib/fsLessons";
import { readStudents } from "@/lib/students";
import { Lesson, Material, Student } from "@/lib/types";
import { ACTIVITY_KIND_LABELS } from "@/lib/activityKinds";
import { buildSlides } from "@/lib/presentSlides";
import { ACCENT_CLASSES, getAccentKey } from "@/lib/presentTheme";
import { ActivityTimer } from "@/components/ActivityTimer";
import { QrOverlay } from "@/components/QrOverlay";
import { MaterialCard } from "@/components/MaterialCard";
import { PresentationPicker } from "@/components/PresentationPicker";
import "./present.css";

function PresentationView({ id }: { id: string }) {
  const { directoryHandle } = useDirectory();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [qrMaterial, setQrMaterial] = useState<Material | null>(null);

  useEffect(() => {
    if (!directoryHandle) return;
    readLesson(directoryHandle, id).then(setLesson);
    readStudents(directoryHandle).then(setStudents);
  }, [directoryHandle, id]);

  const slides = useMemo(() => (lesson ? buildSlides(lesson) : []), [lesson]);
  const activities = useMemo(
    () => (lesson ? lesson.activities.slice().sort((a, b) => a.orderNo - b.orderNo) : []),
    [lesson],
  );

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (qrMaterial) {
        if (e.key === "Escape") setQrMaterial(null);
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        setIndex((i) => Math.min(i + 1, slides.length - 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setIndex((i) => Math.max(i - 1, 0));
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [slides.length, qrMaterial]);

  useEffect(() => {
    function handleFsChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await containerRef.current?.requestFullscreen();
    }
  }

  async function openMaterial(material: Material) {
    if (material.type === "link" && material.url) {
      // External links: keep noopener/noreferrer to avoid reverse-tabnabbing.
      window.open(material.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (!directoryHandle || !material.path) return;
    const file = await readMaterialFile(directoryHandle, material.path);
    const blobUrl = URL.createObjectURL(file);
    // Uploaded files use blob: URLs, which Chromium can fail to resolve in a
    // noopener'd tab because it gets routed to a different renderer process.
    window.open(blobUrl, "_blank");
  }

  if (!lesson) {
    return <p className="px-4 py-12 text-center text-slate-400">불러오는 중…</p>;
  }

  const slide = slides[index];
  const activityIndex =
    slide === "activity" ? slides.slice(0, index + 1).filter((s) => s === "activity").length - 1 : -1;
  const currentActivity = activityIndex >= 0 ? activities[activityIndex] : null;
  const accentKey = getAccentKey(slide, currentActivity?.kind);
  const accent = ACCENT_CLASSES[accentKey];
  const progress = slides.length > 0 ? ((index + 1) / slides.length) * 100 : 0;

  function renderMaterials(materials: Material[]) {
    if (materials.length === 0) return null;
    return (
      <ul className={`mt-8 flex flex-wrap gap-4 ${isFullscreen ? "gap-5" : "gap-4"}`}>
        {materials.map((material, i) => (
          <li key={i}>
            <MaterialCard
              material={material}
              directoryHandle={directoryHandle}
              isFullscreen={isFullscreen}
              accentBadge={accent.badge}
              accentHoverBorder={accent.buttonHover}
              onOpen={() => openMaterial(material)}
              onShowQr={material.type === "link" ? () => setQrMaterial(material) : undefined}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-1 flex-col overflow-hidden ${
        isFullscreen
          ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white"
          : "bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900"
      }`}
    >
      <div className="h-1.5 w-full bg-slate-200/60">
        <div
          className={`h-full ${accent.bar} transition-all duration-300 ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* decorative ambient glow, purely visual */}
      <div
        aria-hidden
        className={`present-glow pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full ${accent.glow} opacity-20 blur-3xl`}
      />
      <div
        aria-hidden
        className={`present-glow pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full ${accent.glow} opacity-10 blur-3xl`}
      />

      {!isFullscreen && (
        <div className="relative z-10 flex items-center justify-between border-b border-slate-200/70 px-4 py-2">
          <Link href={`/lessons/${encodeURIComponent(lesson.id)}`} className="text-sm text-slate-500 hover:text-slate-800">
            ← 준비모드로 돌아가기
          </Link>
          <button
            onClick={toggleFullscreen}
            className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ⛶ 전체화면
          </button>
        </div>
      )}

      <div className="relative z-10 flex flex-1 items-start justify-start px-12 py-12">
        <div className="absolute right-8 top-8 z-20 flex flex-col items-end gap-3">
          {slide === "activity" && currentActivity && (
            <ActivityTimer
              key={`timer-${index}`}
              initialMinutes={currentActivity.durationMinutes}
              accentBar={accent.bar}
              isFullscreen={isFullscreen}
            />
          )}
          <PresentationPicker students={students} accentBar={accent.bar} isFullscreen={isFullscreen} />
        </div>
        <div key={index} className="present-slide-in w-full max-w-4xl text-left">
          {slide === "title" && (
            <div className="text-left present-body-font">
              <div className="flex flex-wrap gap-2">
                {[lesson.subject, lesson.grade, lesson.lessonDate].filter(Boolean).map((tag, i) => (
                  <span
                    key={i}
                    className={`rounded-full px-3 py-1 font-medium ${isFullscreen ? "text-xl" : "text-sm"} ${
                      isFullscreen ? "bg-white/10 text-slate-200" : "bg-slate-900/5 text-slate-600"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className={`present-title-font mt-6 ${isFullscreen ? "text-9xl" : "text-6xl"}`}>{lesson.title}</h1>
              <div className={`mt-5 h-1.5 w-24 rounded-full ${accent.bar}`} />
              {lesson.achievementStandard && (
                <p className={`mt-8 ${isFullscreen ? "text-4xl" : "text-xl"} ${isFullscreen ? "text-slate-300" : "text-slate-600"}`}>
                  {lesson.achievementStandard}
                </p>
              )}
            </div>
          )}

          {slide === "inquiry" && (
            <SlideBlock eyebrow="탐구질문" isFullscreen={isFullscreen} accentBadge={accent.badge}>
              <p className={`present-body-font font-semibold leading-snug ${isFullscreen ? "text-7xl" : "text-4xl"}`}>
                {lesson.inquiryQuestion}
              </p>
            </SlideBlock>
          )}

          {slide === "goal" && (
            <SlideBlock eyebrow="도달목표" isFullscreen={isFullscreen} accentBadge={accent.badge}>
              <p className={`present-body-font font-medium leading-snug ${isFullscreen ? "text-6xl" : "text-3xl"}`}>
                {lesson.goal}
              </p>
            </SlideBlock>
          )}

          {slide === "task" && (
            <SlideBlock eyebrow="수행과제" isFullscreen={isFullscreen} accentBadge={accent.badge}>
              <p className={`present-body-font font-medium leading-snug ${isFullscreen ? "text-6xl" : "text-3xl"}`}>
                {lesson.task}
              </p>
            </SlideBlock>
          )}

          {slide === "activity" &&
            currentActivity &&
            (() => {
              const activity = currentActivity;
              return (
                <SlideBlock
                  eyebrow={ACTIVITY_KIND_LABELS[activity.kind]}
                  isFullscreen={isFullscreen}
                  accentBadge={accent.badge}
                >
                  <h2 className={`present-title-font ${isFullscreen ? "text-6xl" : "text-3xl"}`}>{activity.title}</h2>
                  <p
                    className={`present-body-font mt-6 whitespace-pre-wrap ${isFullscreen ? "text-4xl" : "text-xl"} ${
                      isFullscreen ? "text-slate-200" : "text-slate-700"
                    }`}
                  >
                    {activity.content}
                  </p>
                  {renderMaterials(activity.materials)}
                </SlideBlock>
              );
            })()}

          {slide === "rubrics" && (
            <SlideBlock eyebrow="채점기준" isFullscreen={isFullscreen} accentBadge={accent.badge}>
              <div className={`overflow-hidden rounded-xl border ${isFullscreen ? "border-slate-700" : "border-slate-200"}`}>
                <table
                  className={`present-body-font w-full border-collapse text-left ${isFullscreen ? "text-3xl" : "text-lg"}`}
                >
                  <thead>
                    <tr className={isFullscreen ? "bg-white/5" : "bg-slate-900/5"}>
                      <th className={isFullscreen ? "py-5 px-6" : "py-3 px-4"}>기준</th>
                      <th className={isFullscreen ? "py-5 px-6" : "py-3 px-4"}>상</th>
                      <th className={isFullscreen ? "py-5 px-6" : "py-3 px-4"}>중</th>
                      <th className={isFullscreen ? "py-5 px-6" : "py-3 px-4"}>하</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lesson.rubrics.map((rubric, i) => (
                      <tr key={i} className={`border-t ${isFullscreen ? "border-slate-700" : "border-slate-200"}`}>
                        <td className={`font-medium ${isFullscreen ? "py-5 px-6" : "py-3 px-4"}`}>{rubric.criteria}</td>
                        <td className={isFullscreen ? "py-5 px-6" : "py-3 px-4"}>{rubric.high}</td>
                        <td className={isFullscreen ? "py-5 px-6" : "py-3 px-4"}>{rubric.mid}</td>
                        <td className={isFullscreen ? "py-5 px-6" : "py-3 px-4"}>{rubric.low}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SlideBlock>
          )}

          {slide === "materials" && (
            <SlideBlock eyebrow="수업 자료" isFullscreen={isFullscreen} accentBadge={accent.badge}>
              {renderMaterials(lesson.materials)}
            </SlideBlock>
          )}
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between px-6 py-5">
        <button
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
          disabled={index === 0}
          className={`flex items-center gap-1.5 rounded-full font-medium shadow-sm transition disabled:opacity-30 disabled:shadow-none ${
            isFullscreen ? "px-7 py-3.5 text-xl" : "px-5 py-2.5 text-sm"
          } ${isFullscreen ? "bg-white/10 text-white hover:bg-white/20" : "bg-white text-slate-700 hover:bg-slate-50"}`}
        >
          ← 이전
        </button>
        <span className={`font-medium ${isFullscreen ? "text-lg" : "text-sm"} ${isFullscreen ? "text-slate-400" : "text-slate-500"}`}>
          {index + 1} / {slides.length}
        </span>
        <button
          onClick={() => setIndex((i) => Math.min(i + 1, slides.length - 1))}
          disabled={index === slides.length - 1}
          className={`flex items-center gap-1.5 rounded-full font-medium shadow-sm transition disabled:opacity-30 disabled:shadow-none ${
            isFullscreen ? "px-7 py-3.5 text-xl" : "px-5 py-2.5 text-sm"
          } ${isFullscreen ? "bg-white/10 text-white hover:bg-white/20" : "bg-white text-slate-700 hover:bg-slate-50"}`}
        >
          다음 →
        </button>
      </div>

      {qrMaterial && (
        <QrOverlay material={qrMaterial} isFullscreen={isFullscreen} onClose={() => setQrMaterial(null)} />
      )}
    </div>
  );
}

function SlideBlock({
  eyebrow,
  isFullscreen,
  accentBadge,
  children,
}: {
  eyebrow: string;
  isFullscreen: boolean;
  accentBadge: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span
        className={`present-title-font inline-block rounded-full tracking-wide ${
          isFullscreen ? "px-6 py-2.5 text-4xl" : "px-4 py-1.5 text-2xl"
        } ${isFullscreen ? "bg-white/10 text-white" : accentBadge}`}
      >
        {eyebrow}
      </span>
      <div className="mt-7">{children}</div>
    </div>
  );
}

export default function PresentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <>
      <AppHeader />
      <DirectoryGate>
        <PresentationView id={decodeURIComponent(id)} />
      </DirectoryGate>
    </>
  );
}
