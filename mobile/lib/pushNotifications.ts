import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getDeviceId } from './device';
import { ensureGuestSession } from './auth';
import { supabase } from './supabase';

import { API_URL } from './config';

export type PushRegisterError =
  | 'REQUIRES_DEVICE'
  | 'PERMISSION_DENIED'
  | 'NOT_SIGNED_IN'
  | 'REGISTER_FAILED';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<{
  success: boolean;
  error?: PushRegisterError;
  message?: string;
}> {
  if (!Device.isDevice) {
    return { success: false, error: 'REQUIRES_DEVICE' };
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return { success: false, error: 'PERMISSION_DENIED' };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Momenti Im',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    return { success: false, error: 'REGISTER_FAILED', message: 'NO_PROJECT_ID' };
  }

  let tokenData;
  try {
    tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  } catch {
    return { success: false, error: 'REGISTER_FAILED' };
  }

  await ensureGuestSession();
  const deviceId = await getDeviceId();
  const { data: session } = await supabase.auth.getSession();
  const accessToken = session.session?.access_token;
  if (!accessToken) {
    return { success: false, error: 'NOT_SIGNED_IN' };
  }

  const res = await fetch(`${API_URL}/api/guest/push-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      device_id: deviceId,
      expo_push_token: tokenData.data,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return {
      success: false,
      error: 'REGISTER_FAILED',
      message: typeof data.error === 'string' ? data.error : undefined,
    };
  }

  return { success: true };
}
