"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { MaterialPreviewModal } from "@/components/MaterialPreviewModal";
import { PresentationPicker } from "@/components/PresentationPicker";
import "./present.css";

function isPdfMaterial(material: Material): boolean {
  return material.type === "file" && material.title.toLowerCase().endsWith(".pdf");
}

const SWIPE_THRESHOLD = 60;

function PresentationView({ id }: { id: string }) {
  const { directoryHandle } = useDirectory();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);
  // Fullscreen may already be active on mount: the "발표모드" link requests it on
  // the *previous* page before navigating, and that state survives the
  // client-side route change without firing a fresh "fullscreenchange" event here.
  const [isFullscreen, setIsFullscreen] = useState(
    () => typeof document !== "undefined" && Boolean(document.fullscreenElement),
  );
  const [qrMaterial, setQrMaterial] = useState<Material | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [materialsMenuOpen, setMaterialsMenuOpen] = useState(false);
  const [pdfMaterial, setPdfMaterial] = useState<Material | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

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
    let objectUrl: string | null = null;
    let cancelled = false;
    (async () => {
      setPdfBlobUrl(null);
      if (!directoryHandle || !pdfMaterial?.path) return;
      const file = await readMaterialFile(directoryHandle, pdfMaterial.path);
      if (cancelled) return;
      objectUrl = URL.createObjectURL(file);
      setPdfBlobUrl(objectUrl);
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [directoryHandle, pdfMaterial]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (qrMaterial) {
        if (e.key === "Escape") setQrMaterial(null);
        return;
      }
      if (previewMaterial) {
        if (e.key === "Escape") setPreviewMaterial(null);
        return;
      }
      if (pdfMaterial) {
        if (e.key === "Escape") setPdfMaterial(null);
        return;
      }
      if (materialsMenuOpen && e.key === "Escape") {
        setMaterialsMenuOpen(false);
        return;
      }
      if (e.key === "Escape") {
        // Exiting fullscreen triggers the fullscreenchange listener below, which
        // does the actual navigation back to 준비모드 — kept in one place so any
        // way of losing fullscreen (Escape, F11, browser UI, ...) behaves the same.
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
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
  }, [slides.length, qrMaterial, previewMaterial, pdfMaterial, materialsMenuOpen]);

  useEffect(() => {
    // There is no non-fullscreen presentation view anymore: the moment fullscreen
    // is lost — Escape, F11, browser chrome, anything — bounce straight back to
    // 준비모드 instead of rendering this page in a non-fullscreen state.
    function handleFsChange() {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active) router.push(`/lessons/${encodeURIComponent(id)}`);
    }
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, [id, router]);

  useEffect(() => {
    // Normally already fullscreen by the time this mounts (PresentModeLink
    // requests it before navigating). This is a fallback for edge cases like a
    // direct URL visit; if fullscreen can't be entered there's nothing useful
    // to show, so go back to 준비모드 instead of an unstyled in-between page.
    if (document.fullscreenElement) return;
    containerRef.current?.requestFullscreen().catch(() => {
      router.push(`/lessons/${encodeURIComponent(id)}`);
    });
  }, [id, router]);

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

  function handleMaterialSelect(material: Material) {
    setMaterialsMenuOpen(false);
    if (isPdfMaterial(material)) {
      setPdfMaterial(material);
      return;
    }
    if (material.type === "file") {
      // Non-PDF files (pptx, docx, ...) have no good inline preview — best effort new tab.
      openMaterial(material);
      return;
    }
    setPreviewMaterial(material);
  }

  function handlePointerDown(e: React.PointerEvent) {
    dragStartX.current = e.clientX;
  }

  function handlePointerUp(e: React.PointerEvent) {
    const startX = dragStartX.current;
    dragStartX.current = null;
    if (startX === null) return;
    if (qrMaterial || previewMaterial || pdfMaterial || materialsMenuOpen) return;
    const deltaX = e.clientX - startX;
    if (deltaX > SWIPE_THRESHOLD) {
      setIndex((i) => Math.min(i + 1, slides.length - 1));
    } else if (deltaX < -SWIPE_THRESHOLD) {
      setIndex((i) => Math.max(i - 1, 0));
    }
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
              onOpen={() => handleMaterialSelect(material)}
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
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={`relative flex min-h-0 flex-1 flex-col overflow-hidden touch-pan-y ${
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

      <div
        className={`relative z-10 flex min-h-0 flex-1 justify-start px-12 ${
          pdfMaterial ? "items-stretch py-3" : "items-start py-12"
        }`}
      >
        <div className="absolute right-8 top-8 z-20 flex flex-col items-end gap-2">
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
        {pdfMaterial ? (
          <div className={`flex min-h-0 w-full flex-1 flex-col ${isFullscreen ? "pr-56" : "pr-48"}`}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className={`present-title-font truncate ${isFullscreen ? "text-2xl text-white" : "text-xl text-slate-800"}`}>
                {pdfMaterial.title}
              </p>
              <button
                onClick={() => setPdfMaterial(null)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${
                  isFullscreen ? "bg-white/10 text-white hover:bg-white/20" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                닫기
              </button>
            </div>
            <div className={`min-h-0 flex-1 overflow-hidden rounded-xl border ${isFullscreen ? "border-slate-700 bg-slate-900/40" : "border-slate-200 bg-white"}`}>
              {pdfBlobUrl ? (
                <iframe src={pdfBlobUrl} title={pdfMaterial.title} className="h-full w-full" />
              ) : (
                <div className={`flex h-full items-center justify-center ${isFullscreen ? "text-slate-400" : "text-slate-400"}`}>
                  불러오는 중…
                </div>
              )}
            </div>
          </div>
        ) : (
        <div
          key={index}
          className={`present-slide-in w-full max-w-none text-left ${isFullscreen ? "pr-56" : "pr-48"}`}
        >
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
                <p className={`mt-8 ${isFullscreen ? "text-5xl" : "text-2xl"} ${isFullscreen ? "text-slate-300" : "text-slate-600"}`}>
                  {lesson.achievementStandard}
                </p>
              )}
            </div>
          )}

          {slide === "inquiry" && (
            <SlideBlock eyebrow="탐구질문" isFullscreen={isFullscreen} accentBadge={accent.badge}>
              <p className={`present-body-font font-semibold leading-snug ${isFullscreen ? "text-8xl" : "text-5xl"}`}>
                {lesson.inquiryQuestion}
              </p>
            </SlideBlock>
          )}

          {slide === "goal" && (
            <SlideBlock eyebrow="도달목표" isFullscreen={isFullscreen} accentBadge={accent.badge}>
              <p className={`present-body-font font-medium leading-snug ${isFullscreen ? "text-7xl" : "text-4xl"}`}>
                {lesson.goal}
              </p>
            </SlideBlock>
          )}

          {slide === "task" && (
            <SlideBlock eyebrow="수행과제" isFullscreen={isFullscreen} accentBadge={accent.badge}>
              <p className={`present-body-font font-medium leading-snug ${isFullscreen ? "text-7xl" : "text-4xl"}`}>
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
                  <h2 className={`present-title-font ${isFullscreen ? "text-7xl" : "text-4xl"}`}>{activity.title}</h2>
                  <p
                    className={`present-body-font mt-6 whitespace-pre-wrap ${isFullscreen ? "text-5xl" : "text-2xl"} ${
                      isFullscreen ? "text-slate-200" : "text-slate-700"
                    }`}
                  >
                    {activity.content}
                  </p>
                  {activity.tools.length > 0 && (
                    <div className="mt-8">
                      <p
                        className={`present-body-font text-sm font-medium uppercase tracking-wide ${
                          isFullscreen ? "text-slate-400" : "text-slate-400"
                        }`}
                      >
                        수업도구
                      </p>
                      {renderMaterials(activity.tools)}
                    </div>
                  )}
                </SlideBlock>
              );
            })()}

          {slide === "rubrics" && (
            <SlideBlock eyebrow="채점기준" isFullscreen={isFullscreen} accentBadge={accent.badge}>
              <div className="space-y-6">
                {lesson.rubrics.map((rubric, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-5 ${isFullscreen ? "border-slate-700 bg-white/5" : "border-slate-200 bg-white"}`}
                  >
                    <p className={`present-title-font ${isFullscreen ? "text-6xl text-white" : "text-3xl text-slate-900"}`}>
                      {rubric.criteria}
                    </p>
                    <div className={`present-body-font mt-5 space-y-3 ${isFullscreen ? "text-4xl" : "text-xl"}`}>
                      {[
                        { label: "상", text: rubric.high },
                        { label: "중", text: rubric.mid },
                        { label: "하", text: rubric.low },
                      ].map(({ label, text }) => (
                        <p key={label} className="flex items-start gap-4">
                          <span
                            className={`shrink-0 rounded font-medium ${
                              isFullscreen ? "bg-white/10 px-3 py-1 text-2xl text-white" : `${accent.badge} px-2.5 py-1 text-base`
                            }`}
                          >
                            {label}
                          </span>
                          <span className={isFullscreen ? "text-slate-200" : "text-slate-700"}>{text}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SlideBlock>
          )}

          {slide === "materials" && (
            <SlideBlock eyebrow="수업 자료" isFullscreen={isFullscreen} accentBadge={accent.badge}>
              {renderMaterials(lesson.materials)}
            </SlideBlock>
          )}
        </div>
        )}
      </div>

      <div className="relative z-10 flex items-center justify-end px-6 py-5">
        <div className="relative">
          {materialsMenuOpen && (
            <ul
              className={`absolute bottom-full right-0 mb-2 max-h-64 w-56 overflow-y-auto rounded-xl border shadow-lg ${
                isFullscreen ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
              }`}
            >
              {lesson.materials.length === 0 ? (
                <li className={`px-3 py-2.5 text-sm ${isFullscreen ? "text-slate-400" : "text-slate-400"}`}>
                  등록된 자료가 없습니다.
                </li>
              ) : (
                lesson.materials.map((material, i) => (
                  <li key={i}>
                    <button
                      onClick={() => handleMaterialSelect(material)}
                      className={`block w-full truncate px-3 py-2.5 text-left text-sm ${
                        isFullscreen ? "text-slate-200 hover:bg-white/10" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {material.title}
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
          <button
            onClick={() => setMaterialsMenuOpen((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full font-medium shadow-sm transition ${
              isFullscreen ? "px-7 py-3.5 text-xl" : "px-5 py-2.5 text-sm"
            } ${isFullscreen ? "bg-white/10 text-white hover:bg-white/20" : "bg-white text-slate-700 hover:bg-slate-50"}`}
          >
            수업자료
          </button>
        </div>
      </div>

      {qrMaterial && (
        <QrOverlay material={qrMaterial} isFullscreen={isFullscreen} onClose={() => setQrMaterial(null)} />
      )}
      {previewMaterial && (
        <MaterialPreviewModal
          material={previewMaterial}
          directoryHandle={directoryHandle}
          onClose={() => setPreviewMaterial(null)}
        />
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
    <DirectoryGate>
      <PresentationView id={decodeURIComponent(id)} />
    </DirectoryGate>
  );
}
