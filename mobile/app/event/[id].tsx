import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useActiveEvent } from '@/context/ActiveEventContext';
import { useLocale } from '@/context/LocaleContext';
import { tokens } from '@/theme';

export default function EventDeepLinkScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = Array.isArray(id) ? id[0] : id;
  const { joinEvent } = useActiveEvent();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    (async () => {
      try {
        await joinEvent(eventId);
        router.replace('/(tabs)/camera');
      } catch (err) {
        setError(err instanceof Error ? err.message : t('event.joinFailed'));
      }
    })();
  }, [eventId, joinEvent, router, t]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={tokens.color.accent} />
      <Text style={styles.hint}>{t('event.joining')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: tokens.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  error: {
    color: tokens.color.danger,
    fontSize: 16,
    textAlign: 'center',
  },
  hint: {
    color: tokens.color.muted,
    fontSize: 14,
  },
});
