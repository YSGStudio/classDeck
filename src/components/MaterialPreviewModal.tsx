"use client";

import { useEffect, useState } from "react";
import { Material } from "@/lib/types";
import { readMaterialFile } from "@/lib/fsLessons";

export function MaterialPreviewModal({
  material,
  directoryHandle,
  onClose,
}: {
  material: Material;
  directoryHandle: FileSystemDirectoryHandle | null;
  onClose: () => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    (async () => {
      setBlobUrl(null);
      if (material.type !== "image" || !directoryHandle || !material.path) return;
      const file = await readMaterialFile(directoryHandle, material.path);
      if (cancelled) return;
      objectUrl = URL.createObjectURL(file);
      setBlobUrl(objectUrl);
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [material, directoryHandle]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6" onClick={onClose}>
      <div
        className="flex max-h-full w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <p className="present-title-font truncate text-lg text-slate-800">{material.title}</p>
          <div className="flex shrink-0 items-center gap-2">
            {material.type === "link" && material.url && (
              <a
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
              >
                새 창에서 열기
              </a>
            )}
            <button
              onClick={onClose}
              className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
            >
              닫기
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto rounded-b-2xl bg-slate-50 p-4">
          {material.type === "image" ? (
            blobUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- client-generated blob URL, not a static asset
              <img src={blobUrl} alt={material.title} className="mx-auto max-h-[70vh] w-auto rounded-lg" />
            ) : (
              <p className="py-20 text-center text-sm text-slate-400">불러오는 중…</p>
            )
          ) : (
            material.url && (
              <iframe
                src={material.url}
                title={material.title}
                className="h-[70vh] w-full rounded-lg border border-slate-200 bg-white"
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
