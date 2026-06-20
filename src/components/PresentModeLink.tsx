"use client";

import { useRouter } from "next/navigation";

/**
 * Requests fullscreen synchronously inside the click handler (preserving the
 * click's user-activation), then navigates. Fullscreen state survives the
 * client-side route change since the document never unloads, so the
 * presentation page mounts already in fullscreen.
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
      // Fullscreen request can be denied or unsupported — fall back to a normal,
      // non-fullscreen navigation; the present page still has a manual toggle.
    }
    router.push(href);
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
