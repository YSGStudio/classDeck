import { ActivityKind } from "./types";

export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  intro: "도입",
  activity: "활동",
  closing: "마무리",
};

export const ACTIVITY_KIND_BADGE_STYLES: Record<ActivityKind, string> = {
  intro: "bg-blue-100 text-blue-700",
  activity: "bg-slate-100 text-slate-600",
  closing: "bg-purple-100 text-purple-700",
};
