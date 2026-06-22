"use client";

import { Rubric } from "@/lib/types";

export function RubricEditor({
  rubrics,
  onChange,
}: {
  rubrics: Rubric[];
  onChange: (rubrics: Rubric[]) => void;
}) {
  function updateRow(index: number, field: keyof Rubric, value: string) {
    const next = rubrics.slice();
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  }

  function addRow() {
    onChange([...rubrics, { criteria: "", high: "", mid: "", low: "" }]);
  }

  function removeRow(index: number) {
    onChange(rubrics.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {rubrics.length === 0 && (
        <p className="text-sm text-slate-400">아직 채점기준이 없습니다.</p>
      )}
      {rubrics.map((rubric, index) => (
        <div key={index} className="space-y-2 rounded-md border border-slate-200 p-3">
          <div className="flex items-center gap-2">
            <input
              value={rubric.criteria}
              onChange={(e) => updateRow(index, "criteria", e.target.value)}
              placeholder="채점기준 (예: 자료 분석력)"
              className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
            />
            <button
              onClick={() => removeRow(index)}
              className="rounded-md px-2 py-1.5 text-xs text-red-500 hover:bg-red-50"
            >
              삭제
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-center text-xs font-medium text-slate-500">
              상
            </span>
            <input
              value={rubric.high}
              onChange={(e) => updateRow(index, "high", e.target.value)}
              placeholder="상 수준 기준"
              className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-center text-xs font-medium text-slate-500">
              중
            </span>
            <input
              value={rubric.mid}
              onChange={(e) => updateRow(index, "mid", e.target.value)}
              placeholder="중 수준 기준"
              className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-center text-xs font-medium text-slate-500">
              하
            </span>
            <input
              value={rubric.low}
              onChange={(e) => updateRow(index, "low", e.target.value)}
              placeholder="하 수준 기준"
              className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
        </div>
      ))}
      <button
        onClick={addRow}
        className="rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
      >
        + 채점기준 추가
      </button>
    </div>
  );
}
