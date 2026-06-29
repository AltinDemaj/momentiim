import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { joinRoom } from '@/lib/auth';
import { getActiveEventId, setActiveEventId } from '@/lib/activeEvent';
import { fetchGuestEventSummary, type GuestEventSummary } from '@/lib/events';

interface ActiveEventContextValue {
  activeEventId: string | null;
  session: GuestEventSummary | null;
  loading: boolean;
  joinEvent: (eventId: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  clearActiveEvent: () => Promise<void>;
}

const ActiveEventContext = createContext<ActiveEventContextValue | null>(null);

export function ActiveEventProvider({ children }: { children: ReactNode }) {
  const [activeEventId, setActiveEventIdState] = useState<string | null>(null);
  const [session, setSession] = useState<GuestEventSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const id = activeEventId ?? (await getActiveEventId());
    if (!id) {
      setSession(null);
      setLoading(false);
      return;
    }

    setActiveEventIdState(id);
    const summary = await fetchGuestEventSummary(id);
    setSession(summary);
    setLoading(false);
  }, [activeEventId]);

  useEffect(() => {
    (async () => {
      const stored = await getActiveEventId();
      setActiveEventIdState(stored);
      if (stored) {
        const summary = await fetchGuestEventSummary(stored);
        setSession(summary);
      }
      setLoading(false);
    })();
  }, []);

  const joinEvent = useCallback(async (eventId: string) => {
    setLoading(true);
    await joinRoom(eventId);
    await setActiveEventId(eventId);
    setActiveEventIdState(eventId);
    const summary = await fetchGuestEventSummary(eventId);
    setSession(summary);
    setLoading(false);
  }, []);

  const clearActiveEvent = useCallback(async () => {
    await setActiveEventId(null);
    setActiveEventIdState(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      activeEventId,
      session,
      loading,
      joinEvent,
      refreshSession,
      clearActiveEvent,
    }),
    [activeEventId, session, loading, joinEvent, refreshSession, clearActiveEvent]
  );

  return (
    <ActiveEventContext.Provider value={value}>{children}</ActiveEventContext.Provider>
  );
}

export function useActiveEvent() {
  const ctx = useContext(ActiveEventContext);
  if (!ctx) {
    throw new Error('useActiveEvent must be used within ActiveEventProvider');
  }
  return ctx;
}
