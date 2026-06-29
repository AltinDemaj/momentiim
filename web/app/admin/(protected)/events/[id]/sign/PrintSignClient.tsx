'use client';

import { useRef } from 'react';
import { Download, Printer } from 'lucide-react';

interface PrintSignClientProps {
  event: {
    title: string;
    join_code: string;
    client_name: string | null;
    date: string;
  };
  joinUrl: string;
  qrDataUrl: string;
}

export function PrintSignClient({ event, joinUrl, qrDataUrl }: PrintSignClientProps) {
  const signRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0B0B0C';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#F5E9D3';
    ctx.lineWidth = 4;
    ctx.strokeRect(80, 80, canvas.width - 160, canvas.height - 160);

    ctx.fillStyle = '#fafafa';
    ctx.font = 'bold 56px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Momentiim', canvas.width / 2, 200);

    ctx.font = '36px system-ui, sans-serif';
    ctx.fillStyle = '#e4e4e7';
    ctx.fillText(event.title, canvas.width / 2, 280);

    const img = new Image();
    img.onload = () => {
      const qrSize = 480;
      ctx.drawImage(img, (canvas.width - qrSize) / 2, 360, qrSize, qrSize);

      ctx.fillStyle = '#F5E9D3';
      ctx.font = 'bold 72px monospace';
      ctx.fillText(event.join_code, canvas.width / 2, 940);

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '28px system-ui, sans-serif';
      ctx.fillText('Scan to join · Snap photos · Develop later', canvas.width / 2, 1020);

      ctx.font = '22px system-ui, sans-serif';
      ctx.fillStyle = '#71717a';
      const lines = joinUrl.match(/.{1,52}/g) ?? [joinUrl];
      lines.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, 1100 + i * 32);
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `momentiim-${event.join_code}-table-sign.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.src = qrDataUrl;
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-moment-bg)] text-[color:var(--color-moment-text)] print:bg-white print:text-black">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10 print:hidden">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400"
          >
            <Printer className="h-4 w-4" />
            Print table sign
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Download high-res PNG
          </button>
        </div>
      </div>

      <div
        ref={signRef}
        className="mx-auto my-8 max-w-xl rounded-3xl border-4 border-amber-500/80 bg-slate-950 p-12 text-center shadow-2xl print:my-0 print:max-w-none print:border-black print:bg-white print:shadow-none"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-500 print:text-black">
          Momentiim
        </p>
        <h1 className="mt-4 text-3xl font-bold text-white print:text-black">{event.title}</h1>
        {event.client_name && (
          <p className="mt-2 text-slate-400 print:text-slate-600">For {event.client_name}</p>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="Room QR code"
          width={280}
          height={280}
          className="mx-auto mt-10 rounded-2xl"
        />

        <p className="mt-8 font-mono text-5xl font-bold tracking-[0.3em] text-amber-500 print:text-black">
          {event.join_code}
        </p>
        <p className="mt-6 text-lg text-slate-300 print:text-slate-700">
          Scan to join · Snap photos · Develop later
        </p>
        <p className="mt-4 break-all font-mono text-xs text-slate-500 print:text-slate-600">
          {joinUrl}
        </p>
      </div>
    </div>
  );
}
