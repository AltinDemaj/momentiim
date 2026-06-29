import { useEffect } from 'react';
import type { StudioTab } from './types';

export function useStudioKeyboard(handlers: {
  onApprove?: () => void;
  onReject?: () => void;
  onDelete?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onTogglePlay?: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'a' || e.key === 'A') handlers.onApprove?.();
      if (e.key === 'r' || e.key === 'R') handlers.onReject?.();
      if (e.key === 'Delete' || e.key === 'Backspace') handlers.onDelete?.();
      if (e.key === 'ArrowLeft') handlers.onPrev?.();
      if (e.key === 'ArrowRight') handlers.onNext?.();
      if (e.key === ' ') {
        e.preventDefault();
        handlers.onTogglePlay?.();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlers]);
}

export const STUDIO_TABS: { id: StudioTab; label: string }[] = [
  { id: 'gallery', label: 'Gallery' },
  { id: 'edit', label: 'Timeline' },
  { id: 'cover', label: 'Cover' },
  { id: 'deliver', label: 'Deliver' },
];
