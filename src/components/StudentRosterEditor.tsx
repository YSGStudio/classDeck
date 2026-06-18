"use client";

import { useEffect, useState } from "react";
import { useDirectory } from "@/context/DirectoryContext";
import { generateStudentId, readStudents, writeStudents } from "@/lib/students";
import { Student, StudentGender } from "@/lib/types";

const GENDER_LABELS: Record<StudentGender, string> = { male: "남", female: "여" };

function sortByNumber(students: Student[]): Student[] {
  return students.slice().sort((a, b) => a.number - b.number);
}

export function StudentRosterEditor() {
  const { directoryHandle } = useDirectory();
  const [students, setStudents] = useState<Student[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [numberInput, setNumberInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [genderInput, setGenderInput] = useState<StudentGender>("male");

  useEffect(() => {
    if (!directoryHandle) return;
    readStudents(directoryHandle).then((loadedStudents) => {
      setStudents(sortByNumber(loadedStudents));
      setLoaded(true);
    });
  }, [directoryHandle]);

  async function persist(next: Student[]) {
    const sorted = sortByNumber(next);
    setStudents(sorted);
    if (directoryHandle) await writeStudents(directoryHandle, sorted);
  }

  function handleAdd() {
    const number = Number(numberInput);
    if (!nameInput.trim() || !number) return;
    void persist([...students, { id: generateStudentId(), number, name: nameInput.trim(), gender: genderInput }]);
    setNumberInput("");
    setNameInput("");
  }

  function updateStudent(id: string, patch: Partial<Student>) {
    void persist(students.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeStudent(id: string) {
    void persist(students.filter((s) => s.id !== id));
  }

  if (!directoryHandle) {
    return <p className="text-sm text-slate-500">폴더를 먼저 연결하면 학생 명단을 등록할 수 있습니다.</p>;
  }

  if (!loaded) {
    return <p className="text-sm text-slate-400">불러오는 중…</p>;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[64px_1fr_72px_auto] gap-2">
        <input
          type="number"
          value={numberInput}
          onChange={(e) => setNumberInput(e.target.value)}
          placeholder="번호"
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
        />
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="이름"
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
        />
        <select
          value={genderInput}
          onChange={(e) => setGenderInput(e.target.value as StudentGender)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
        >
          <option value="male">남</option>
          <option value="female">여</option>
        </select>
        <button
          onClick={handleAdd}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          추가
        </button>
      </div>

      {students.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">아직 등록된 학생이 없습니다.</p>
      ) : (
        <ul className="space-y-1.5">
          {students.map((student) => (
            <li key={student.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1.5">
              <input
                type="number"
                value={student.number}
                onChange={(e) => updateStudent(student.id, { number: Number(e.target.value) || 0 })}
                className="w-14 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
              />
              <input
                type="text"
                value={student.name}
                onChange={(e) => updateStudent(student.id, { name: e.target.value })}
                className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
              />
              <select
                value={student.gender}
                onChange={(e) => updateStudent(student.id, { gender: e.target.value as StudentGender })}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
              >
                <option value="male">{GENDER_LABELS.male}</option>
                <option value="female">{GENDER_LABELS.female}</option>
              </select>
              <button
                onClick={() => removeStudent(student.id)}
                className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
