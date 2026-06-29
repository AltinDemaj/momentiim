import { useEffect, useState } from 'react';

export interface CountdownParts {
  totalMs: number;
  hours: number;
  minutes: number;
  seconds: number;
  label: string;
  isPast: boolean;
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function useCountdown(targetIso: string | null | undefined): CountdownParts | null {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!targetIso) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [targetIso]);

  if (!targetIso) return null;

  const target = new Date(targetIso).getTime();
  const diff = target - now;
  const isPast = diff <= 0;
  const totalMs = Math.abs(diff);
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);

  return {
    totalMs,
    hours,
    minutes,
    seconds,
    label: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
    isPast,
  };
}

export function getGreeting(name: string): string {
  const hour = new Date().getHours();
  let timeGreeting = 'Good evening';
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 17) timeGreeting = 'Good afternoon';

  return `${timeGreeting},\n${name}`;
}

export function formatEventWhen(dateIso: string): string {
  const d = new Date(dateIso);
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  if (isToday) return 'Tonight';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export function formatRevealLabel(
  revealedAt: string | null,
  revealScheduledAt: string | null,
  isPast: boolean
): string {
  if (revealedAt) return 'Developed';
  if (!revealScheduledAt) return 'Developing…';
  if (isPast) return 'Ready to reveal';
  const d = new Date(revealScheduledAt);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return 'Develops tomorrow';
  return `Develops ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}
