import { Lesson, LessonSummary, normalizeLesson } from "./types";

export const LESSONS_DIR = "lessons";
export const MATERIALS_DIR = "materials";

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

export async function ensureSubdirectories(root: FileSystemDirectoryHandle): Promise<void> {
  await root.getDirectoryHandle(LESSONS_DIR, { create: true });
  await root.getDirectoryHandle(MATERIALS_DIR, { create: true });
}

/** Sanitizes a path segment so it is safe to use as a single file/folder name. */
function sanitizeSegment(segment: string): string {
  return segment.replace(/[\\/:*?"<>|]/g, "_").trim();
}

export function buildLessonId(lessonDate: string, subject: string, title: string): string {
  return [lessonDate, sanitizeSegment(subject), sanitizeSegment(title)]
    .filter(Boolean)
    .join("_");
}

export async function listLessons(root: FileSystemDirectoryHandle): Promise<LessonSummary[]> {
  const lessonsDir = await root.getDirectoryHandle(LESSONS_DIR, { create: true });
  const summaries: LessonSummary[] = [];
  for await (const [name, handle] of lessonsDir.entries()) {
    if (handle.kind !== "file" || !name.endsWith(".json")) continue;
    try {
      const file = await (handle as FileSystemFileHandle).getFile();
      const text = await file.text();
      const lesson = JSON.parse(text) as Lesson;
      summaries.push({
        id: lesson.id,
        lessonDate: lesson.lessonDate,
        title: lesson.title,
        subject: lesson.subject,
        grade: lesson.grade,
        achievementStandard: lesson.achievementStandard ?? "",
      });
    } catch {
      // skip unreadable/corrupt lesson files
    }
  }
  summaries.sort((a, b) => b.lessonDate.localeCompare(a.lessonDate));
  return summaries;
}

export async function readLesson(
  root: FileSystemDirectoryHandle,
  id: string,
): Promise<Lesson | null> {
  const lessonsDir = await root.getDirectoryHandle(LESSONS_DIR, { create: true });
  try {
    const fileHandle = await lessonsDir.getFileHandle(`${id}.json`);
    const file = await fileHandle.getFile();
    const text = await file.text();
    return normalizeLesson(JSON.parse(text) as Lesson);
  } catch {
    return null;
  }
}

export async function writeLesson(root: FileSystemDirectoryHandle, lesson: Lesson): Promise<void> {
  const lessonsDir = await root.getDirectoryHandle(LESSONS_DIR, { create: true });
  const fileHandle = await lessonsDir.getFileHandle(`${lesson.id}.json`, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(lesson, null, 2));
  await writable.close();
}

export async function deleteLesson(root: FileSystemDirectoryHandle, id: string): Promise<void> {
  const lessonsDir = await root.getDirectoryHandle(LESSONS_DIR, { create: true });
  await lessonsDir.removeEntry(`${id}.json`).catch(() => {});
  const materialsDir = await root.getDirectoryHandle(MATERIALS_DIR, { create: true });
  await materialsDir.removeEntry(id, { recursive: true }).catch(() => {});
}

export async function saveMaterialFile(
  root: FileSystemDirectoryHandle,
  pathSegments: string[],
  file: File,
): Promise<string> {
  const safeSegments = pathSegments.map(sanitizeSegment);
  let dir = await root.getDirectoryHandle(MATERIALS_DIR, { create: true });
  for (const segment of safeSegments) {
    dir = await dir.getDirectoryHandle(segment, { create: true });
  }
  const safeName = sanitizeSegment(file.name);
  const fileHandle = await dir.getFileHandle(safeName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(file);
  await writable.close();
  return [MATERIALS_DIR, ...safeSegments, safeName].join("/");
}

export async function deleteMaterialFile(
  root: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<void> {
  const parts = relativePath.split("/").filter(Boolean);
  let dir = root;
  for (const part of parts.slice(0, -1)) {
    dir = await dir.getDirectoryHandle(part);
  }
  await dir.removeEntry(parts[parts.length - 1]).catch(() => {});
}

export async function readMaterialFile(
  root: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<File> {
  const parts = relativePath.split("/").filter(Boolean);
  let dir = root;
  for (const part of parts.slice(0, -1)) {
    dir = await dir.getDirectoryHandle(part);
  }
  const fileHandle = await dir.getFileHandle(parts[parts.length - 1]);
  return fileHandle.getFile();
}
