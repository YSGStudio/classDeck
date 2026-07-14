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
  durationMinutes?: number;
  /** Links (e.g. Google Forms, Padlet) for this activity. Shown on the activity's
   * presentation slide with "새 창에서 열기" and "QR로 보기" so students can join. */
  tools: Material[];
  /** @deprecated Materials now live on Lesson.materials. Kept only so normalizeLesson
   * can migrate entries from lessons saved by older versions of the app. */
  materials?: Material[];
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
  /** Concatenated activity titles/content, so dashboard search can match on them
   * without loading every lesson's full JSON again. */
  searchText: string;
}

/** Fills in fields missing from lesson files saved by older versions of the app.
 * Also migrates materials that were once attached per-activity back onto
 * Lesson.materials, since that's now the single place materials are edited. */
export function normalizeLesson(raw: Lesson): Lesson {
  const activities = raw.activities ?? [];
  const hoistedMaterials = activities.flatMap((a) => a.materials ?? []);
  return {
    ...raw,
    rubrics: raw.rubrics ?? [],
    materials: [...(raw.materials ?? []), ...hoistedMaterials],
    activities: activities.map((activity, index) => ({
      id: activity.id ?? `activity-${index}`,
      orderNo: activity.orderNo ?? index + 1,
      kind: activity.kind ?? "activity",
      title: activity.title ?? "",
      content: activity.content ?? "",
      durationMinutes: activity.durationMinutes,
      tools: activity.tools ?? [],
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
