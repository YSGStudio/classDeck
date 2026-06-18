"use client";

import { AppHeader } from "@/components/AppHeader";
import { StudentRosterEditor } from "@/components/StudentRosterEditor";
import { useDirectory } from "@/context/DirectoryContext";

export default function SettingsPage() {
  const { status, directoryName, error, pickDirectory, forgetDirectory } = useDirectory();

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <h1 className="text-xl font-bold text-slate-900">설정</h1>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">데이터 폴더</h2>
          <p className="mt-2 text-sm text-slate-600">
            {status === "connected" && directoryName
              ? `현재 "${directoryName}" 폴더에 수업 자료를 저장하고 있습니다.`
              : "아직 데이터 폴더가 연결되지 않았습니다."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={pickDirectory}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              {status === "connected" ? "다른 폴더 선택" : "폴더 선택"}
            </button>
            {status === "connected" && (
              <button
                onClick={forgetDirectory}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                폴더 연결 해제
              </button>
            )}
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <p className="mt-4 text-xs text-slate-500">
            폴더를 통째로 복사하면 백업·이동이 끝납니다. 폴더를 삭제하면 데이터를 복구할 수 없으니
            주기적으로 백업해 주세요.
          </p>
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">학생 명단</h2>
          <p className="mt-2 text-sm text-slate-600">
            발표모드의 발표뽑기 기능에서 사용할 학생 번호·이름·성별을 등록합니다.
          </p>
          <div className="mt-4">
            <StudentRosterEditor />
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">브라우저 호환성</h2>
          <p className="mt-2 text-sm text-slate-600">
            ClassDeck은 내 컴퓨터의 폴더에 직접 저장하기 위해 File System Access API를 사용합니다.
            이 기능은 <strong>Chrome, Edge, Opera 등 크로미움 계열 브라우저</strong>에서만 동작하며,
            Safari·Firefox에서는 지원되지 않습니다.
          </p>
        </section>
      </main>
    </>
  );
}
