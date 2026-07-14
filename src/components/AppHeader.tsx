"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDirectory } from "@/context/DirectoryContext";

const statusLabel: Record<string, string> = {
  checking: "확인 중…",
  unsupported: "브라우저 미지원",
  disconnected: "폴더 미연결",
  "needs-permission": "권한 확인 필요",
  connected: "연결됨",
};

const statusColor: Record<string, string> = {
  checking: "bg-slate-200 text-slate-600",
  unsupported: "bg-red-100 text-red-700",
  disconnected: "bg-amber-100 text-amber-700",
  "needs-permission": "bg-amber-100 text-amber-700",
  connected: "bg-emerald-100 text-emerald-700",
};

export function AppHeader() {
  const { status, directoryName } = useDirectory();
  const pathname = usePathname();

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
        pathname === href
          ? "bg-slate-900 text-white"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="border-b border-slate-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-slate-900">ClassDeck</span>
          <span className="text-xs text-slate-400">수업 도우미</span>
        </Link>
        <nav className="flex items-center gap-1">
          {navLink("/", "대시보드")}
          {navLink("/standards", "성취기준")}
          {navLink("/settings", "설정")}
        </nav>
        <div className="flex items-center gap-2">
          {directoryName && (
            <span className="hidden text-sm text-slate-500 sm:inline">📁 {directoryName}</span>
          )}
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor[status]}`}>
            {statusLabel[status]}
          </span>
        </div>
      </div>
    </header>
  );
}
