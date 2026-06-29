import * as SecureStore from 'expo-secure-store';
import {
  DEFAULT_LOCALE,
  translations,
  type AppLocale,
  type TranslationKey,
} from './translations';

const LOCALE_KEY = 'momentiim_locale';

export async function getStoredLocale(): Promise<AppLocale> {
  try {
    const raw = await SecureStore.getItemAsync(LOCALE_KEY);
    if (raw === 'sq' || raw === 'en' || raw === 'de') return raw;
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE;
}

export async function setStoredLocale(locale: AppLocale): Promise<void> {
  await SecureStore.setItemAsync(LOCALE_KEY, locale);
}

export function translate(
  locale: AppLocale,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  let text = translations[locale][key] ?? translations[DEFAULT_LOCALE][key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

export type { AppLocale, TranslationKey };
export { LOCALE_LABELS, DEFAULT_LOCALE, translations } from './translations';
