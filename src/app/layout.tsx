import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DirectoryProvider } from "@/context/DirectoryContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClassDeck — 수업 도우미",
  description: "수업 준비부터 발표, 회고까지 — 내 PC 폴더에 그대로 저장",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <DirectoryProvider>{children}</DirectoryProvider>
      </body>
    </html>
  );
}
