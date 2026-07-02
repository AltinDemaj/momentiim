'use client';

import { Download, Printer, X } from 'lucide-react';
import Link from 'next/link';
import type { AdminRoomCardData } from '@/lib/admin/room-types';

interface RoomQrModalProps {
  room: AdminRoomCardData;
  onClose: () => void;
}

export function RoomQrModal({ room, onClose }: RoomQrModalProps) {
  function handlePrint() {
    window.open(`/admin/events/${room.id}/sign`, '_blank');
  }

  function handleDownload() {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0B0B0C';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#C9A96E';
    ctx.lineWidth = 4;
    ctx.strokeRect(80, 80, canvas.width - 160, canvas.height - 160);

    ctx.fillStyle = '#F5E9D3';
    ctx.font = 'bold 56px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Momenti Im', canvas.width / 2, 200);

    ctx.font = '36px system-ui, sans-serif';
    ctx.fillStyle = '#e4e4e7';
    ctx.fillText(room.title, canvas.width / 2, 280);

    const img = new Image();
    img.onload = () => {
      const qrSize = 480;
      ctx.drawImage(img, (canvas.width - qrSize) / 2, 360, qrSize, qrSize);
      ctx.fillStyle = '#C9A96E';
      ctx.font = 'bold 48px monospace';
      ctx.fillText(room.join_code, canvas.width / 2, 940);
      ctx.font = '28px system-ui, sans-serif';
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText('Scan to join · Snap photos · Develop later', canvas.width / 2, 1020);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `momentiim-${room.join_code}-table-sign.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
    };
    img.src = room.qrDataUrl;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative w-full max-w-md rounded-[20px] border border-neutral-800/80 bg-[#121214]/95 p-6 shadow-[0_32px_120px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-400 motion-safe hover:bg-white/5 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 id="qr-modal-title" className="pr-8 text-lg font-semibold text-white">
          Table tent QR — {room.title}
        </h2>
        <p className="mt-1 text-sm text-neutral-400">
          Guests scan to join the disposable camera room.
        </p>

        <div className="mt-6 flex justify-center rounded-[16px] border border-neutral-800/60 bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={room.qrDataUrl} alt={`QR code for ${room.title}`} className="h-52 w-52" />
        </div>

        <p className="mt-4 text-center font-mono text-sm tracking-widest text-[#C9A96E]">
          {room.join_code}
        </p>
        <p className="mt-2 break-all text-center text-xs text-neutral-500">{room.joinUrl}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-4 py-2.5 text-sm font-medium text-[#C9A96E] motion-safe hover:bg-[#C9A96E]/15"
          >
            <Download className="h-4 w-4" />
            Download PNG
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] border border-neutral-700 bg-neutral-800/50 px-4 py-2.5 text-sm font-medium text-neutral-200 motion-safe hover:bg-neutral-800"
          >
            <Printer className="h-4 w-4" />
            Print sign
          </button>
        </div>

        <Link
          href={`/admin/events/${room.id}/sign`}
          className="mt-3 block text-center text-xs text-neutral-500 motion-safe hover:text-[#C9A96E]"
        >
          Open full printable layout →
        </Link>
      </div>
    </div>
  );
}
