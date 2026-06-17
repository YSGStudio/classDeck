"use client";

import { Material } from "@/lib/types";
import { QrCodeImage } from "@/components/QrCodeImage";

export function QrOverlay({
  material,
  isFullscreen,
  onClose,
}: {
  material: Material;
  isFullscreen?: boolean;
  onClose: () => void;
}) {
  if (!material.url) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4"
      onClick={onClose}
    >
      <div
        className={`present-body-font flex flex-col items-center gap-4 rounded-3xl bg-white shadow-2xl ${
          isFullscreen ? "px-16 py-12" : "px-10 py-8"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className={`present-title-font text-slate-800 ${isFullscreen ? "text-4xl" : "text-2xl"}`}>{material.title}</p>
        <QrCodeImage key={material.url} value={material.url} size={isFullscreen ? 440 : 320} />
        <p className={`max-w-xs break-all text-center text-slate-400 ${isFullscreen ? "text-lg" : "text-sm"}`}>
          {material.url}
        </p>
        <button
          onClick={onClose}
          className={`rounded-full bg-slate-900 font-medium text-white hover:bg-slate-800 ${
            isFullscreen ? "px-8 py-3 text-lg" : "px-6 py-2 text-sm"
          }`}
        >
          닫기
        </button>
      </div>
    </div>
  );
}
