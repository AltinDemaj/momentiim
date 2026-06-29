import * as SecureStore from 'expo-secure-store';
import { randomUUID } from 'expo-crypto';

const DEVICE_ID_KEY = 'momentiim_device_id';
const GUEST_PASSWORD_KEY = 'momentiim_guest_password';

export async function getDeviceId(): Promise<string> {
  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) {
    id = randomUUID();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  }
  return id;
}

export async function getGuestPassword(): Promise<string> {
  let password = await SecureStore.getItemAsync(GUEST_PASSWORD_KEY);
  if (!password) {
    password = randomUUID();
    await SecureStore.setItemAsync(GUEST_PASSWORD_KEY, password);
  }
  return password;
}
