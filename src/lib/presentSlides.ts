import { Lesson } from "./types";

export type Slide = "title" | "inquiry" | "goal" | "task" | "activity" | "rubrics" | "materials";

export function buildSlides(lesson: Lesson): Slide[] {
  const slides: Slide[] = ["title"];
  if (lesson.inquiryQuestion) slides.push("inquiry");
  if (lesson.goal) slides.push("goal");
  if (lesson.task) slides.push("task");
  if (lesson.rubrics.length > 0) slides.push("rubrics");
  lesson.activities.forEach(() => slides.push("activity"));
  if (lesson.materials.length > 0) slides.push("materials");
  return slides;
}
