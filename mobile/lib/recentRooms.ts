import * as SecureStore from 'expo-secure-store';

const RECENT_ROOMS_KEY = 'momentiim_recent_rooms';
const MAX_RECENT = 8;

export interface RecentRoom {
  eventId: string;
  title: string;
  joinCode: string;
  joinedAt: string;
}

export async function getRecentRooms(): Promise<RecentRoom[]> {
  try {
    const raw = await SecureStore.getItemAsync(RECENT_ROOMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentRoom[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addRecentRoom(room: Omit<RecentRoom, 'joinedAt'>): Promise<void> {
  const existing = await getRecentRooms();
  const next: RecentRoom[] = [
    { ...room, joinedAt: new Date().toISOString() },
    ...existing.filter((r) => r.eventId !== room.eventId),
  ].slice(0, MAX_RECENT);

  await SecureStore.setItemAsync(RECENT_ROOMS_KEY, JSON.stringify(next));
}

export async function removeRecentRoom(eventId: string): Promise<void> {
  const existing = await getRecentRooms();
  await SecureStore.setItemAsync(
    RECENT_ROOMS_KEY,
    JSON.stringify(existing.filter((r) => r.eventId !== eventId))
  );
}
