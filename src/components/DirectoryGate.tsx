"use client";

import { ReactNode } from "react";
import { useDirectory } from "@/context/DirectoryContext";

export function DirectoryGate({ children }: { children: ReactNode }) {
  const { status, error, pickDirectory, reconnect } = useDirectory();

  if (status === "checking") {
    return <p className="px-4 py-12 text-center text-slate-400">불러오는 중…</p>;
  }

  if (status === "unsupported") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h2 className="text-lg font-semibold text-slate-900">이 브라우저는 지원되지 않습니다</h2>
        <p className="mt-3 text-sm text-slate-600">
          ClassDeck은 내 컴퓨터의 폴더에 직접 데이터를 저장하기 위해 File System Access
          API를 사용합니다. 현재 브라우저는 이 기능을 지원하지 않습니다.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Chrome, Edge, Opera 등 <strong>크로미움 계열 브라우저</strong>로 접속해 주세요.
        </p>
      </div>
    );
  }

  if (status === "disconnected") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h2 className="text-lg font-semibold text-slate-900">데이터 폴더를 선택해 주세요</h2>
        <p className="mt-3 text-sm text-slate-600">
          수업 자료를 저장할 내 컴퓨터의 폴더를 한 번 지정하면, 다음부터는 자동으로 불러옵니다.
        </p>
        <button
          onClick={pickDirectory}
          className="mt-6 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          폴더 선택
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (status === "needs-permission") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h2 className="text-lg font-semibold text-slate-900">폴더 접근을 다시 허용해 주세요</h2>
        <p className="mt-3 text-sm text-slate-600">
          이전에 연결한 폴더가 있습니다. 보안을 위해 방문마다 한 번씩 접근을 허용해야 합니다.
        </p>
        <button
          onClick={reconnect}
          className="mt-6 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          접근 허용
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return <>{children}</>;
}
