"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCodeImage({ value, size = 280 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { width: size, margin: 1 }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) {
    return <div style={{ width: size, height: size }} className="animate-pulse rounded-lg bg-slate-200" />;
  }

  // eslint-disable-next-line @next/next/no-img-element -- client-generated data: URL, not a static asset
  return <img src={dataUrl} alt={`QR code for ${value}`} width={size} height={size} className="rounded-lg" />;
}
