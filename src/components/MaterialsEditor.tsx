"use client";

import { useState } from "react";
import { Material } from "@/lib/types";
import { deleteMaterialFile, readMaterialFile, saveMaterialFile } from "@/lib/fsLessons";

export function MaterialsEditor({
  storagePath,
  directoryHandle,
  materials,
  onChange,
  compact = false,
}: {
  storagePath: string[];
  directoryHandle: FileSystemDirectoryHandle;
  materials: Material[];
  onChange: (materials: Material[]) => void;
  compact?: boolean;
}) {
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addLink() {
    if (!linkTitle.trim() || !linkUrl.trim()) return;
    onChange([...materials, { type: "link", title: linkTitle, url: linkUrl }]);
    setLinkTitle("");
    setLinkUrl("");
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const path = await saveMaterialFile(directoryHandle, storagePath, file);
      const type = file.type.startsWith("image/") ? "image" : "file";
      onChange([...materials, { type, title: file.name, path }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "파일을 저장하지 못했습니다.");
    } finally {
      setUploading(false);
    }
  }

  async function openMaterial(material: Material) {
    if (material.type === "link" && material.url) {
      // External links: keep noopener/noreferrer to avoid reverse-tabnabbing.
      window.open(material.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (material.path) {
      const file = await readMaterialFile(directoryHandle, material.path);
      const url = URL.createObjectURL(file);
      // Uploaded files use blob: URLs, which Chromium can fail to resolve in a
      // noopener'd tab because it gets routed to a different renderer process.
      window.open(url, "_blank");
    }
  }

  async function removeMaterial(index: number) {
    const material = materials[index];
    if (material.path) {
      await deleteMaterialFile(directoryHandle, material.path);
    }
    onChange(materials.filter((_, i) => i !== index));
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      {materials.length === 0 && (
        <p className="text-sm text-slate-400">아직 등록된 자료가 없습니다.</p>
      )}
      <ul className="space-y-2">
        {materials.map((material, index) => (
          <li
            key={index}
            className={`flex items-center justify-between gap-2 rounded-md border border-slate-200 ${compact ? "px-2 py-1.5" : "px-3 py-2"}`}
          >
            <button onClick={() => openMaterial(material)} className="flex-1 truncate text-left text-sm text-slate-700 hover:underline">
              <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                {material.type === "link" ? "링크" : material.type === "image" ? "이미지" : "파일"}
              </span>
              {material.title}
            </button>
            <button onClick={() => removeMaterial(index)} className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50">
              삭제
            </button>
          </li>
        ))}
      </ul>

      <div className={`grid grid-cols-1 gap-2 rounded-md border border-slate-200 sm:grid-cols-[1fr_1fr_auto] ${compact ? "p-2" : "p-3"}`}>
        <input
          value={linkTitle}
          onChange={(e) => setLinkTitle(e.target.value)}
          placeholder="링크 제목"
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
        />
        <input
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://..."
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
        />
        <button
          onClick={addLink}
          className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          링크 추가
        </button>
      </div>

      <div>
        <label className="inline-block rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
          {uploading ? "업로드 중…" : "+ 파일/이미지 업로드"}
          <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
        </label>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
