"use client";

import { useMemo, useState } from "react";
import { Student, StudentGender } from "@/lib/types";

type GenderFilter = "random" | StudentGender;

const GENDER_LABELS: Record<StudentGender, string> = { male: "남", female: "녀" };

function pickRandom(pool: Student[], count: number): Student[] {
  const shuffled = pool.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export function PresentationPicker({
  students,
  accentBar,
  isFullscreen,
}: {
  students: Student[];
  accentBar: string;
  isFullscreen: boolean;
}) {
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("random");
  const [count, setCount] = useState(1);
  const [result, setResult] = useState<Student[] | null>(null);

  const eligible = useMemo(
    () => (genderFilter === "random" ? students : students.filter((s) => s.gender === genderFilter)),
    [students, genderFilter],
  );

  const countOptions = useMemo(
    () => Array.from({ length: Math.max(1, eligible.length) }, (_, i) => i + 1),
    [eligible.length],
  );
  const effectiveCount = Math.min(count, countOptions[countOptions.length - 1] ?? 1);

  function handlePick() {
    if (eligible.length === 0) return;
    setResult(pickRandom(eligible, effectiveCount));
  }

  const selectClass = `rounded-md border px-2 py-1.5 text-sm focus:outline-none ${
    isFullscreen ? "border-slate-600 bg-transparent text-white" : "border-slate-300 text-slate-900"
  }`;

  return (
    <>
      <div
        className={`flex flex-col gap-2 rounded-2xl border px-4 py-3 shadow-lg ${
          isFullscreen ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"
        }`}
      >
        <p className={`text-xs font-medium ${isFullscreen ? "text-slate-300" : "text-slate-500"}`}>발표뽑기</p>
        {students.length === 0 ? (
          <p className={`text-xs ${isFullscreen ? "text-slate-400" : "text-slate-400"}`}>
            설정에서 학생을 먼저 등록하세요.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value as GenderFilter)}
                className={selectClass}
              >
                <option value="random">랜덤</option>
                <option value="male">남</option>
                <option value="female">녀</option>
              </select>
              <select
                value={effectiveCount}
                onChange={(e) => setCount(Number(e.target.value))}
                className={selectClass}
              >
                {countOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}명
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handlePick}
              disabled={eligible.length === 0}
              className={`rounded-full px-4 py-1.5 text-sm font-medium text-white transition disabled:opacity-40 ${accentBar}`}
            >
              뽑기
            </button>
          </>
        )}
      </div>

      {result && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4"
          onClick={() => setResult(null)}
        >
          <div className="flex flex-wrap items-center justify-center gap-4 p-6" onClick={(e) => e.stopPropagation()}>
            {result.map((student) => (
              <div
                key={student.id}
                className="flex w-40 flex-col items-center gap-2 rounded-2xl bg-white px-6 py-8 shadow-2xl"
              >
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                  {student.number}번 · {GENDER_LABELS[student.gender]}
                </span>
                <span className="present-title-font text-3xl text-slate-900">{student.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
