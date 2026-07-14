/** 발표 슬라이드용 적응형 텍스트 크기.
 * 글자 수가 적으면 크게, 많으면 단계적으로 작게 골라 줄바꿈이 과도하게
 * 일어나는 것을 막는다. maxChars 기준은 전체화면(1920px) 가로폭에서
 * 한글이 몇 자 들어가는지를 기준으로 잡은 값. */

export interface TextSizeTier {
  /** 이 단계가 적용되는 최대 글자 수 (마지막 단계는 Infinity) */
  maxChars: number;
  fullscreen: string;
  normal: string;
}

export function pickTextSize(
  textOrLength: string | number,
  tiers: TextSizeTier[],
  isFullscreen: boolean,
): string {
  const length = typeof textOrLength === "number" ? textOrLength : [...textOrLength].length;
  const tier = tiers.find((t) => length <= t.maxChars) ?? tiers[tiers.length - 1];
  return isFullscreen ? tier.fullscreen : tier.normal;
}

/** 제목 슬라이드의 수업 제목 */
export const TITLE_TIERS: TextSizeTier[] = [
  { maxChars: 12, fullscreen: "text-9xl", normal: "text-6xl" },
  { maxChars: 20, fullscreen: "text-8xl", normal: "text-5xl" },
  { maxChars: 32, fullscreen: "text-7xl", normal: "text-4xl" },
  { maxChars: Infinity, fullscreen: "text-6xl", normal: "text-3xl" },
];

/** 제목 슬라이드의 성취기준 */
export const STANDARD_TIERS: TextSizeTier[] = [
  { maxChars: 50, fullscreen: "text-5xl", normal: "text-2xl" },
  { maxChars: 100, fullscreen: "text-4xl", normal: "text-xl" },
  { maxChars: Infinity, fullscreen: "text-3xl", normal: "text-lg" },
];

/** 탐구질문 */
export const INQUIRY_TIERS: TextSizeTier[] = [
  { maxChars: 20, fullscreen: "text-8xl", normal: "text-5xl" },
  { maxChars: 40, fullscreen: "text-7xl", normal: "text-4xl" },
  { maxChars: 70, fullscreen: "text-6xl", normal: "text-3xl" },
  { maxChars: Infinity, fullscreen: "text-5xl", normal: "text-2xl" },
];

/** 도달목표 · 수행과제 */
export const GOAL_TASK_TIERS: TextSizeTier[] = [
  { maxChars: 30, fullscreen: "text-7xl", normal: "text-4xl" },
  { maxChars: 60, fullscreen: "text-6xl", normal: "text-3xl" },
  { maxChars: 110, fullscreen: "text-5xl", normal: "text-2xl" },
  { maxChars: Infinity, fullscreen: "text-4xl", normal: "text-xl" },
];

/** 활동 제목 */
export const ACTIVITY_TITLE_TIERS: TextSizeTier[] = [
  { maxChars: 20, fullscreen: "text-7xl", normal: "text-4xl" },
  { maxChars: 35, fullscreen: "text-6xl", normal: "text-3xl" },
  { maxChars: Infinity, fullscreen: "text-5xl", normal: "text-2xl" },
];

/** 활동 내용 (여러 줄일 수 있어 총 글자 수 기준) */
export const ACTIVITY_CONTENT_TIERS: TextSizeTier[] = [
  { maxChars: 80, fullscreen: "text-5xl", normal: "text-2xl" },
  { maxChars: 160, fullscreen: "text-4xl", normal: "text-xl" },
  { maxChars: 280, fullscreen: "text-3xl", normal: "text-lg" },
  { maxChars: Infinity, fullscreen: "text-2xl", normal: "text-base" },
];

/** 채점기준 — 기준 문구 (모든 루브릭 텍스트 합산 길이 기준) */
export const RUBRIC_CRITERIA_TIERS: TextSizeTier[] = [
  { maxChars: 120, fullscreen: "text-6xl", normal: "text-3xl" },
  { maxChars: 250, fullscreen: "text-5xl", normal: "text-2xl" },
  { maxChars: Infinity, fullscreen: "text-4xl", normal: "text-xl" },
];

/** 채점기준 — 상/중/하 수준 문구 (모든 루브릭 텍스트 합산 길이 기준) */
export const RUBRIC_LEVEL_TIERS: TextSizeTier[] = [
  { maxChars: 120, fullscreen: "text-4xl", normal: "text-xl" },
  { maxChars: 250, fullscreen: "text-3xl", normal: "text-lg" },
  { maxChars: Infinity, fullscreen: "text-2xl", normal: "text-base" },
];
