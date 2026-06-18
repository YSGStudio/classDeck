"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { DirectoryGate } from "@/components/DirectoryGate";
import { stashPendingAchievementStandard } from "@/lib/pendingAchievementStandard";
import {
  ACHIEVEMENT_STANDARDS,
  AchievementStandard,
  GRADE_BAND_OPTIONS,
  SUBJECT_ORDER,
  gradeBandLabel,
} from "@/lib/achievementStandards";

function LevelRow({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <p className="flex gap-2 text-sm">
      <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">{label}</span>
      <span className="text-slate-600">{text}</span>
    </p>
  );
}

function StandardRow({
  standard,
  expanded,
  onToggle,
  onCreate,
}: {
  standard: AchievementStandard;
  expanded: boolean;
  onToggle: () => void;
  onCreate: () => void;
}) {
  return (
    <li className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <button onClick={onToggle} className="flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">{standard.code}</span>
            <span className="text-xs text-slate-400">
              {gradeBandLabel(standard.gradeBand)} · {standard.domain}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-800">{standard.standard}</p>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onCreate}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
          >
            수업작성하기
          </button>
          <button onClick={onToggle} className="text-slate-400 hover:text-slate-700" aria-label="자세히 보기">
            {expanded ? "▲" : "▼"}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="space-y-1.5 border-t border-slate-100 px-4 py-3">
          <LevelRow label="상" text={standard.levelHigh} />
          <LevelRow label="중" text={standard.levelMid} />
          <LevelRow label="하" text={standard.levelLow} />
          {standard.explanation && <p className="mt-2 text-xs leading-relaxed text-slate-500">{standard.explanation}</p>}
        </div>
      )}
    </li>
  );
}

function StandardsExplorer() {
  const router = useRouter();
  const [gradeBand, setGradeBand] = useState<string>("all");
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());

  const byGradeBand = useMemo(
    () => ACHIEVEMENT_STANDARDS.filter((s) => gradeBand === "all" || s.gradeBand === gradeBand),
    [gradeBand],
  );

  const subjectCounts = useMemo(() => {
    const counts = new Map<string, { standards: number; domains: Set<string> }>();
    for (const s of byGradeBand) {
      if (!counts.has(s.subject)) counts.set(s.subject, { standards: 0, domains: new Set() });
      const entry = counts.get(s.subject)!;
      entry.standards += 1;
      entry.domains.add(s.domain);
    }
    return counts;
  }, [byGradeBand]);

  const searchResults = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return byGradeBand.filter(
      (s) => s.standard.includes(q) || s.code.includes(q) || s.domain.includes(q),
    );
  }, [byGradeBand, query]);

  const subjectStandards = useMemo(() => {
    if (!activeSubject) return [];
    return byGradeBand.filter((s) => s.subject === activeSubject);
  }, [byGradeBand, activeSubject]);

  const subjectDomains = useMemo(() => {
    const map = new Map<string, AchievementStandard[]>();
    for (const s of subjectStandards) {
      if (!map.has(s.domain)) map.set(s.domain, []);
      map.get(s.domain)!.push(s);
    }
    return map;
  }, [subjectStandards]);

  function toggleExpanded(code: string) {
    setExpandedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function handleCreateLesson(standard: AchievementStandard) {
    stashPendingAchievementStandard(standard.standard);
    router.push("/lessons/new");
  }

  const totalCount = byGradeBand.length;
  const isSearching = query.trim().length > 0;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">성취기준</h1>
        <p className="text-sm text-slate-400">
          {subjectCounts.size}개 교과 · 총 {totalCount}개 성취기준
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setGradeBand("all")}
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${
            gradeBand === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          전체 학년군
        </button>
        {GRADE_BAND_OPTIONS.map((band) => (
          <button
            key={band}
            onClick={() => setGradeBand(band)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              gradeBand === band ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {gradeBandLabel(band)}
          </button>
        ))}
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="성취기준, 코드, 영역으로 검색"
        className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
      />

      {isSearching ? (
        <ul className="mt-4 space-y-2">
          {searchResults.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-10 text-center text-sm text-slate-400">
              검색 결과가 없습니다.
            </p>
          ) : (
            searchResults.map((s) => (
              <StandardRow
                key={s.code}
                standard={s}
                expanded={expandedCodes.has(s.code)}
                onToggle={() => toggleExpanded(s.code)}
                onCreate={() => handleCreateLesson(s)}
              />
            ))
          )}
        </ul>
      ) : activeSubject === null ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SUBJECT_ORDER.filter((subject) => subjectCounts.has(subject)).map((subject) => {
            const entry = subjectCounts.get(subject)!;
            return (
              <button
                key={subject}
                onClick={() => setActiveSubject(subject)}
                className="rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-slate-400 hover:shadow-sm"
              >
                <p className="font-semibold text-slate-900">{subject}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {entry.domains.size}개 영역 · {entry.standards}개 성취기준
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-4">
          <button onClick={() => setActiveSubject(null)} className="mb-3 text-sm text-slate-400 hover:text-slate-700">
            ← 전체 교과 보기
          </button>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">{activeSubject}</h2>
          <div className="space-y-6">
            {[...subjectDomains.entries()].map(([domain, items]) => (
              <div key={domain}>
                <h3 className="mb-2 text-sm font-semibold text-slate-500">
                  {domain} <span className="text-slate-400">· {items.length}개</span>
                </h3>
                <ul className="space-y-2">
                  {items.map((s) => (
                    <StandardRow
                      key={s.code}
                      standard={s}
                      expanded={expandedCodes.has(s.code)}
                      onToggle={() => toggleExpanded(s.code)}
                      onCreate={() => handleCreateLesson(s)}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

export default function StandardsPage() {
  return (
    <>
      <AppHeader />
      <DirectoryGate>
        <StandardsExplorer />
      </DirectoryGate>
    </>
  );
}
