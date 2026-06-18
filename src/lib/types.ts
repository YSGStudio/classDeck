export type RubricLevel = "high" | "mid" | "low";

export interface Rubric {
  criteria: string;
  high: string;
  mid: string;
  low: string;
}

export type ActivityKind = "intro" | "activity" | "closing";

export interface Activity {
  id: string;
  orderNo: number;
  kind: ActivityKind;
  title: string;
  content: string;
  materials: Material[];
  durationMinutes?: number;
}

export type MaterialType = "link" | "image" | "file";

export interface Material {
  type: MaterialType;
  title: string;
  url?: string;
  path?: string;
}

export interface Lesson {
  id: string;
  lessonDate: string;
  title: string;
  subject: string;
  grade: string;
  achievementStandard: string;
  inquiryQuestion: string;
  rubrics: Rubric[];
  goal: string;
  task: string;
  activities: Activity[];
  materials: Material[];
  feedback: string;
  createdAt: string;
  updatedAt: string;
}

export type StudentGender = "male" | "female";

export interface Student {
  id: string;
  number: number;
  name: string;
  gender: StudentGender;
}

export interface LessonSummary {
  id: string;
  lessonDate: string;
  title: string;
  subject: string;
  grade: string;
  achievementStandard: string;
}

/** Fills in fields missing from lesson files saved by older versions of the app. */
export function normalizeLesson(raw: Lesson): Lesson {
  return {
    ...raw,
    rubrics: raw.rubrics ?? [],
    materials: raw.materials ?? [],
    activities: (raw.activities ?? []).map((activity, index) => ({
      id: activity.id ?? `activity-${index}`,
      orderNo: activity.orderNo ?? index + 1,
      kind: activity.kind ?? "activity",
      title: activity.title ?? "",
      content: activity.content ?? "",
      materials: activity.materials ?? [],
    })),
  };
}

export function createEmptyLesson(input: {
  id: string;
  lessonDate: string;
  title: string;
  subject: string;
  grade: string;
}): Lesson {
  const now = new Date().toISOString();
  return {
    id: input.id,
    lessonDate: input.lessonDate,
    title: input.title,
    subject: input.subject,
    grade: input.grade,
    achievementStandard: "",
    inquiryQuestion: "",
    rubrics: [],
    goal: "",
    task: "",
    activities: [],
    materials: [],
    feedback: "",
    createdAt: now,
    updatedAt: now,
  };
}
