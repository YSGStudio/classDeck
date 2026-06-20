"use client";

import { useRouter } from "next/navigation";

/**
 * Requests fullscreen synchronously inside the click handler (preserving the
 * click's user-activation), then navigates. Fullscreen state survives the
 * client-side route change since the document never unloads, so the
 * presentation page mounts already in fullscreen.
 *
 * There is no non-fullscreen presentation screen — only 준비모드 (this page)
 * and the fullscreen presentation exist. If the browser denies or doesn't
 * support fullscreen, we stay put rather than navigating to a degraded view.
 */
export function PresentModeLink({
  lessonId,
  className,
  children,
}: {
  lessonId: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const href = `/lessons/${encodeURIComponent(lessonId)}/present`;

  async function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Denied or unsupported — stay on 준비모드 rather than navigating to a
      // presentation page with no fullscreen to show.
      return;
    }
    // Client-side navigation: a full reload would unload the document and
    // exit fullscreen before the presentation page ever mounts.
    router.push(href);
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
