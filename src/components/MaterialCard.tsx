"use client";

import { useEffect, useState } from "react";
import { Material } from "@/lib/types";
import { readMaterialFile } from "@/lib/fsLessons";

function extensionLabel(name: string): string {
  const ext = name.split(".").pop();
  return ext && ext !== name ? ext.toUpperCase() : "파일";
}

function MaterialTypeIcon({ type, big }: { type: Material["type"]; big: boolean }) {
  const cls = big ? "h-8 w-8 shrink-0" : "h-5 w-5 shrink-0";
  if (type === "link") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={cls}>
        <path
          d="M8.5 11.5 11.5 8.5M7 13l-1.5 1.5a2.5 2.5 0 0 1-3.5-3.5L4 9M13 7l1.5-1.5a2.5 2.5 0 0 1 3.5 3.5L16.5 11"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (type === "image") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={cls}>
        <rect x="2.5" y="3.5" width="15" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="7" cy="8" r="1.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 14.5 8 11l2.5 2 3-3 2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cls}>
      <path
        d="M5.5 2.5h6l3 3v11a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M11.5 2.5V6h3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function MaterialCard({
  material,
  directoryHandle,
  isFullscreen,
  accentBadge,
  accentHoverBorder,
  onOpen,
  onShowQr,
}: {
  material: Material;
  directoryHandle: FileSystemDirectoryHandle | null;
  isFullscreen: boolean;
  accentBadge: string;
  accentHoverBorder: string;
  onOpen: () => void;
  onShowQr?: () => void;
}) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    if (material.type !== "image" || !directoryHandle || !material.path) return;
    let objectUrl: string | null = null;
    readMaterialFile(directoryHandle, material.path).then((file) => {
      objectUrl = URL.createObjectURL(file);
      setThumbUrl(objectUrl);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [material.type, material.path, directoryHandle]);

  const cardBase = `group flex flex-col overflow-hidden rounded-2xl border text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
    isFullscreen ? "border-slate-700 bg-slate-900/60" : `border-slate-200 bg-white ${accentHoverBorder}`
  }`;

  if (material.type === "image") {
    return (
      <button onClick={onOpen} className={`${cardBase} ${isFullscreen ? "w-80" : "w-44"}`}>
        <div className={`${isFullscreen ? "h-52" : "h-28"} w-full overflow-hidden bg-slate-100`}>
          {thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- client-generated blob URL, not a static asset
            <img src={thumbUrl} alt={material.title} className="h-full w-full object-cover transition group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full animate-pulse items-center justify-center text-slate-300">
              <MaterialTypeIcon type="image" big={isFullscreen} />
            </div>
          )}
        </div>
        <span
          className={`present-body-font truncate px-3 py-2.5 font-medium ${
            isFullscreen ? "text-lg text-white" : "text-sm text-slate-700"
          }`}
        >
          {material.title}
        </span>
      </button>
    );
  }

  return (
    <div className={`${cardBase} ${isFullscreen ? "w-80" : "w-56"}`}>
      <button onClick={onOpen} className="flex flex-1 items-center gap-3 px-4 py-4 text-left">
        <span
          className={`flex shrink-0 items-center justify-center rounded-xl ${isFullscreen ? "h-14 w-14" : "h-10 w-10"} ${accentBadge}`}
        >
          <MaterialTypeIcon type={material.type} big={isFullscreen} />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`present-body-font block truncate font-medium ${
              isFullscreen ? "text-xl text-white" : "text-base text-slate-800"
            }`}
          >
            {material.title}
          </span>
          <span className={`block ${isFullscreen ? "text-sm text-slate-400" : "text-xs text-slate-400"}`}>
            {material.type === "link" ? "웹사이트 열기" : `${extensionLabel(material.title)} 파일`}
          </span>
        </span>
      </button>
      {material.type === "link" && onShowQr && (
        <button
          onClick={onShowQr}
          className={`present-body-font border-t px-4 py-2.5 text-center font-medium transition ${
            isFullscreen
              ? "border-slate-700 text-slate-300 hover:bg-white/5"
              : "border-slate-100 text-slate-500 hover:bg-slate-50"
          } ${isFullscreen ? "text-sm" : "text-xs"}`}
        >
          QR로 보기
        </button>
      )}
    </div>
  );
}
