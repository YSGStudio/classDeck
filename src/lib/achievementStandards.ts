import standards34 from "@/data/achievementStandards-3-4.json";
import standards56 from "@/data/achievementStandards-5-6.json";

export interface AchievementStandard {
  gradeBand: string;
  subject: string;
  domain: string;
  code: string;
  standard: string;
  levelHigh: string;
  levelMid: string;
  levelLow: string;
  explanation: string;
}

// A handful of rows in the source spreadsheets have a typo'd 학년군 column
// (e.g. "3~5" instead of "3~4"). The leading digit of the standard code
// (e.g. "[4과03-01]") is authoritative for which 2-year band a standard
// belongs to, so re-derive gradeBand from it instead of trusting the column.
function normalizeGradeBand(standard: AchievementStandard): AchievementStandard {
  const codeDigit = standard.code.match(/^\[(\d)/)?.[1];
  const gradeBand = codeDigit === "6" ? "5~6" : codeDigit === "4" ? "3~4" : standard.gradeBand;
  return { ...standard, gradeBand };
}

// Baked into the app bundle at build time — there's no database, so the
// curriculum reference data ships as static JSON rather than living in a
// user-picked folder like lessons do.
export const ACHIEVEMENT_STANDARDS: AchievementStandard[] = [
  ...(standards34 as AchievementStandard[]),
  ...(standards56 as AchievementStandard[]),
].map(normalizeGradeBand);

export const GRADE_BAND_OPTIONS = Array.from(new Set(ACHIEVEMENT_STANDARDS.map((s) => s.gradeBand))).sort();

export const SUBJECT_ORDER = ["국어", "도덕", "사회", "수학", "과학", "실과", "체육", "음악", "미술", "영어"];

export function gradeBandLabel(gradeBand: string): string {
  return `${gradeBand}학년군`;
}
