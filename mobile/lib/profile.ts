import * as SecureStore from 'expo-secure-store';

const DISPLAY_NAME_KEY = 'momentiim_display_name';

export async function getDisplayName(): Promise<string> {
  const name = await SecureStore.getItemAsync(DISPLAY_NAME_KEY);
  return name?.trim() || 'Guest';
}

export async function setDisplayName(name: string): Promise<void> {
  await SecureStore.setItemAsync(DISPLAY_NAME_KEY, name.trim());
}
