"use client";

import { useMemo, useState } from "react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function MonthCalendar({
  datesWithLessons,
  selectedDate,
  onSelectDate,
}: {
  datesWithLessons: Set<string>;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const today = toDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const cells = useMemo(() => {
    const { year, month } = cursor;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: { day: number | null; key: string | null }[] = [];
    for (let i = 0; i < firstDay; i++) result.push({ day: null, key: null });
    for (let day = 1; day <= daysInMonth; day++) {
      result.push({ day, key: toDateKey(year, month, day) });
    }
    return result;
  }, [cursor]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }))}
          className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100"
          aria-label="이전 달"
        >
          ◀
        </button>
        <span className="text-sm font-semibold text-slate-900">
          {cursor.year}년 {cursor.month + 1}월
        </span>
        <button
          onClick={() => setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }))}
          className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100"
          aria-label="다음 달"
        >
          ▶
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (cell.day === null) return <div key={idx} />;
          const hasLesson = cell.key !== null && datesWithLessons.has(cell.key);
          const isSelected = cell.key === selectedDate;
          const isToday = cell.key === today;
          return (
            <button
              key={idx}
              onClick={() => onSelectDate(isSelected ? null : cell.key)}
              className={`relative flex h-9 flex-col items-center justify-center rounded-md text-sm transition ${
                isSelected
                  ? "bg-slate-900 text-white"
                  : isToday
                    ? "bg-slate-100 font-semibold text-slate-900"
                    : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {cell.day}
              {hasLesson && (
                <span
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${
                    isSelected ? "bg-white" : "bg-emerald-500"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
