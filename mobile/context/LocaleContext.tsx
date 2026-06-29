import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getStoredLocale,
  setStoredLocale,
  translate,
  type AppLocale,
  type TranslationKey,
} from '@/lib/i18n';

interface LocaleContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => Promise<void>;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  ready: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>('sq');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getStoredLocale().then((stored) => {
      setLocaleState(stored);
      setReady(true);
    });
  }, []);

  const setLocale = useCallback(async (next: AppLocale) => {
    await setStoredLocale(next);
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t, ready }), [locale, setLocale, t, ready]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
