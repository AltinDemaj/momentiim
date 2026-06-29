import * as SecureStore from 'expo-secure-store';

const ACTIVE_EVENT_KEY = 'momentiim_active_event_id';

export async function getActiveEventId(): Promise<string | null> {
  return SecureStore.getItemAsync(ACTIVE_EVENT_KEY);
}

export async function setActiveEventId(eventId: string | null): Promise<void> {
  if (eventId) {
    await SecureStore.setItemAsync(ACTIVE_EVENT_KEY, eventId);
  } else {
    await SecureStore.deleteItemAsync(ACTIVE_EVENT_KEY);
  }
}
