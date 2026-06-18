import { Student } from "./types";

const STUDENTS_FILE = "students.json";

export async function readStudents(root: FileSystemDirectoryHandle): Promise<Student[]> {
  try {
    const fileHandle = await root.getFileHandle(STUDENTS_FILE);
    const file = await fileHandle.getFile();
    const text = await file.text();
    const data = JSON.parse(text);
    return Array.isArray(data) ? (data as Student[]) : [];
  } catch {
    return [];
  }
}

export async function writeStudents(root: FileSystemDirectoryHandle, students: Student[]): Promise<void> {
  const fileHandle = await root.getFileHandle(STUDENTS_FILE, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(students, null, 2));
  await writable.close();
}

export function generateStudentId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `student-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
