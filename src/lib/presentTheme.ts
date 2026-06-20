import { ActivityKind } from "./types";
import { Slide } from "./presentSlides";

export type AccentKey =
  | "slate"
  | "indigo"
  | "emerald"
  | "amber"
  | "rose"
  | "cyan"
  | "blue"
  | "violet"
  | "fuchsia";

interface AccentClasses {
  badge: string;
  bar: string;
  glow: string;
  border: string;
  buttonHover: string;
}

export const ACCENT_CLASSES: Record<AccentKey, AccentClasses> = {
  slate: {
    badge: "bg-slate-100 text-slate-600",
    bar: "bg-slate-500",
    glow: "bg-slate-400",
    border: "border-slate-300",
    buttonHover: "hover:border-slate-400 hover:bg-slate-50",
  },
  indigo: {
    badge: "bg-indigo-100 text-indigo-700",
    bar: "bg-indigo-500",
    glow: "bg-indigo-400",
    border: "border-indigo-300",
    buttonHover: "hover:border-indigo-400 hover:bg-indigo-50",
  },
  emerald: {
    badge: "bg-emerald-100 text-emerald-700",
    bar: "bg-emerald-500",
    glow: "bg-emerald-400",
    border: "border-emerald-300",
    buttonHover: "hover:border-emerald-400 hover:bg-emerald-50",
  },
  amber: {
    badge: "bg-amber-100 text-amber-700",
    bar: "bg-amber-500",
    glow: "bg-amber-400",
    border: "border-amber-300",
    buttonHover: "hover:border-amber-400 hover:bg-amber-50",
  },
  rose: {
    badge: "bg-rose-100 text-rose-700",
    bar: "bg-rose-500",
    glow: "bg-rose-400",
    border: "border-rose-300",
    buttonHover: "hover:border-rose-400 hover:bg-rose-50",
  },
  cyan: {
    badge: "bg-cyan-100 text-cyan-700",
    bar: "bg-cyan-500",
    glow: "bg-cyan-400",
    border: "border-cyan-300",
    buttonHover: "hover:border-cyan-400 hover:bg-cyan-50",
  },
  blue: {
    badge: "bg-blue-100 text-blue-700",
    bar: "bg-blue-500",
    glow: "bg-blue-400",
    border: "border-blue-300",
    buttonHover: "hover:border-blue-400 hover:bg-blue-50",
  },
  violet: {
    badge: "bg-violet-100 text-violet-700",
    bar: "bg-violet-500",
    glow: "bg-violet-400",
    border: "border-violet-300",
    buttonHover: "hover:border-violet-400 hover:bg-violet-50",
  },
  fuchsia: {
    badge: "bg-fuchsia-100 text-fuchsia-700",
    bar: "bg-fuchsia-500",
    glow: "bg-fuchsia-400",
    border: "border-fuchsia-300",
    buttonHover: "hover:border-fuchsia-400 hover:bg-fuchsia-50",
  },
};

// Shared fixed box size so the timer and presentation-picker corner widgets
// always match, regardless of how much content either one has at the moment.
export const CORNER_WIDGET_SIZE = {
  normal: "w-40 h-28",
  fullscreen: "w-48 h-32",
};

export function getAccentKey(slide: Slide, activityKind?: ActivityKind): AccentKey {
  switch (slide) {
    case "title":
      return "slate";
    case "inquiry":
      return "indigo";
    case "goal":
      return "emerald";
    case "task":
      return "amber";
    case "rubrics":
      return "rose";
    case "materials":
      return "cyan";
    case "activity":
      if (activityKind === "intro") return "blue";
      if (activityKind === "closing") return "fuchsia";
      return "violet";
  }
}
