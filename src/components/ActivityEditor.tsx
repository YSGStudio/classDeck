"use client";

import { useRef, useState } from "react";
import { Activity, ActivityKind } from "@/lib/types";
import { ACTIVITY_KIND_BADGE_STYLES, ACTIVITY_KIND_LABELS } from "@/lib/activityKinds";

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `activity-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function renumber(activities: Activity[]): Activity[] {
  return activities.map((a, i) => ({ ...a, orderNo: i + 1 }));
}

/** Position of this activity among others of the same kind, for display (e.g. "활동2"). */
function kindIndex(activities: Activity[], index: number): number {
  const kind = activities[index].kind;
  return activities.slice(0, index + 1).filter((a) => a.kind === kind).length;
}

export function ActivityEditor({
  activities,
  onChange,
}: {
  activities: Activity[];
  onChange: (activities: Activity[]) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // Mirrors dragIndex synchronously: dragstart/dragover/drop can fire faster than
  // React re-renders, so handleDrop must not rely on a possibly-stale state closure.
  const dragIndexRef = useRef<number | null>(null);

  function updateRow(index: number, field: "title" | "content", value: string) {
    const next = activities.slice();
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  }

  function updateDuration(index: number, value: string) {
    const next = activities.slice();
    const minutes = value === "" ? undefined : Math.max(0, Number(value));
    next[index] = { ...next[index], durationMinutes: minutes };
    onChange(next);
  }

  function addRow(kind: ActivityKind) {
    onChange(renumber([...activities, { id: generateId(), orderNo: 0, kind, title: "", content: "" }]));
  }

  function removeRow(index: number) {
    onChange(renumber(activities.filter((_, i) => i !== index)));
  }

  function handleDrop(targetIndex: number) {
    const sourceIndex = dragIndexRef.current;
    dragIndexRef.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
    if (sourceIndex === null || sourceIndex === targetIndex) return;
    const next = activities.slice();
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    onChange(renumber(next));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => addRow("intro")}
          className="rounded-md border border-dashed border-blue-300 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50"
        >
          + 도입 추가
        </button>
        <button
          onClick={() => addRow("activity")}
          className="rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          + 활동 추가
        </button>
        <button
          onClick={() => addRow("closing")}
          className="rounded-md border border-dashed border-purple-300 px-3 py-1.5 text-sm text-purple-700 hover:bg-purple-50"
        >
          + 마무리 추가
        </button>
      </div>

      {activities.length === 0 && <p className="text-sm text-slate-400">아직 추가된 섹션이 없습니다.</p>}

      {activities.map((activity, index) => (
        <div
          key={activity.id}
          draggable
          onDragStart={() => {
            dragIndexRef.current = index;
            setDragIndex(index);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverIndex(index);
          }}
          onDragEnd={() => {
            dragIndexRef.current = null;
            setDragIndex(null);
            setDragOverIndex(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(index);
          }}
          className={`rounded-md border p-3 transition ${
            dragOverIndex === index ? "border-slate-900 bg-slate-50" : "border-slate-200"
          } ${dragIndex === index ? "opacity-50" : ""}`}
        >
          <div className="flex items-center gap-2">
            <span className="cursor-grab select-none text-slate-400" title="드래그해서 순서 변경">
              ⠿
            </span>
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${ACTIVITY_KIND_BADGE_STYLES[activity.kind]}`}>
              {ACTIVITY_KIND_LABELS[activity.kind]}
              {activity.kind === "activity" && kindIndex(activities, index)}
            </span>
            <input
              value={activity.title}
              onChange={(e) => updateRow(index, "title", e.target.value)}
              placeholder="제목"
              className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
            />
            <label className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
              <input
                type="number"
                min={0}
                value={activity.durationMinutes ?? ""}
                onChange={(e) => updateDuration(index, e.target.value)}
                placeholder="-"
                className="w-14 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
              />
              분 타이머
            </label>
            <button onClick={() => removeRow(index)} className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50">
              삭제
            </button>
          </div>
          <textarea
            value={activity.content}
            onChange={(e) => updateRow(index, "content", e.target.value)}
            placeholder="내용"
            rows={2}
            className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
      ))}
    </div>
  );
}
