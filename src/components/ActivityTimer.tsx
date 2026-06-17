"use client";

import { useEffect, useState } from "react";

export function ActivityTimer({
  initialMinutes,
  accentBar,
  isFullscreen,
}: {
  initialMinutes?: number;
  accentBar: string;
  isFullscreen: boolean;
}) {
  const startMinutes = initialMinutes && initialMinutes > 0 ? initialMinutes : 5;
  // The parent's slide wrapper is keyed by slide index, so a fresh instance of
  // this component — with fresh state — mounts on every slide change.
  const [minutes, setMinutes] = useState(startMinutes);
  const [remaining, setRemaining] = useState(startMinutes * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  function changeMinutes(next: number) {
    const clamped = Math.max(1, Math.min(99, next));
    setMinutes(clamped);
    setRemaining(clamped * 60);
  }

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const isDone = remaining === 0;

  const stepperButtonClass = `flex items-center justify-center rounded-full font-medium transition disabled:opacity-30 ${
    isFullscreen ? "h-9 w-9 text-lg" : "h-6 w-6 text-sm"
  } ${isFullscreen ? "bg-white/10 text-white hover:bg-white/20" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`;

  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-2xl border shadow-lg ${isFullscreen ? "px-6 py-5" : "px-4 py-3"} ${
        isDone
          ? "border-red-400 bg-red-50"
          : isFullscreen
            ? "border-slate-700 bg-slate-900/80"
            : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => changeMinutes(minutes - 1)}
          disabled={running}
          className={stepperButtonClass}
          title="1분 줄이기"
        >
          −
        </button>
        <input
          type="number"
          min={1}
          max={99}
          value={minutes}
          disabled={running}
          onChange={(e) => changeMinutes(Number(e.target.value) || 1)}
          className={`rounded-md border text-center disabled:opacity-50 ${
            isFullscreen ? "w-16 px-2 py-1 text-lg" : "w-10 px-1 py-0.5 text-sm"
          } ${isFullscreen ? "border-slate-600 bg-transparent text-white" : "border-slate-300 text-slate-900"}`}
        />
        <span className={isFullscreen ? "text-base text-slate-300" : "text-xs text-slate-500"}>분</span>
        <button
          onClick={() => changeMinutes(minutes + 1)}
          disabled={running}
          className={stepperButtonClass}
          title="1분 늘리기"
        >
          +
        </button>
      </div>

      <span
        className={`present-title-font tabular-nums ${isFullscreen ? "text-8xl" : "text-4xl"} ${
          isDone ? "text-red-600" : isFullscreen ? "text-white" : "text-slate-900"
        }`}
      >
        {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
      </span>

      <div className="flex gap-1.5">
        <button
          onClick={() => setRunning((r) => !r)}
          disabled={isDone}
          className={`rounded-full font-medium text-white transition disabled:opacity-40 ${
            isFullscreen ? "px-5 py-2 text-lg" : "px-3 py-1 text-xs"
          } ${accentBar}`}
        >
          {running ? "일시정지" : "시작"}
        </button>
        <button
          onClick={() => {
            setRemaining(minutes * 60);
            setRunning(false);
          }}
          className={`rounded-full font-medium ${isFullscreen ? "px-5 py-2 text-lg" : "px-3 py-1 text-xs"} ${
            isFullscreen ? "bg-white/10 text-white hover:bg-white/20" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          리셋
        </button>
      </div>
    </div>
  );
}
