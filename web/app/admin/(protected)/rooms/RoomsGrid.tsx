import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { AdminRoomCardData } from '@/lib/admin/room-types';
import { RoomCard } from './RoomCard';

export function RoomsGrid({ rooms }: { rooms: AdminRoomCardData[] }) {
  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-neutral-800/60 bg-[#121215]/50 px-8 py-24 text-center backdrop-blur-md">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[16px] border border-amber-500/20 bg-amber-500/5">
          <Plus className="h-6 w-6 text-[#C9A96E]/80" />
        </div>
        <p className="text-lg font-medium tracking-wide text-white">No rooms yet</p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
          Create your first disposable camera room and print a table sign for guests.
        </p>
        <Link
          href="/admin/rooms/new"
          className="group relative mt-8 inline-flex items-center gap-2 overflow-hidden rounded-[14px] border border-amber-500/40 bg-neutral-950/60 px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[#F5E9D3] backdrop-blur-md"
        >
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 opacity-0 transition-opacity group-hover:opacity-100 group-hover:animate-pulse" />
          <Plus className="relative h-4 w-4" />
          <span className="relative">Create your first room</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
