import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { fetchChallenges, type EventChallenge } from '@/lib/guestFeatures';
import { useLocale } from '@/context/LocaleContext';

const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
};

interface ScavengerHuntSheetProps {
  visible: boolean;
  eventId: string;
  guestId: string;
  onClose: () => void;
  onSelectChallenge: (challengeId: string) => void;
  activeChallengeId: string | null;
}

export function ScavengerHuntSheet({
  visible,
  eventId,
  guestId,
  onClose,
  onSelectChallenge,
  activeChallengeId,
}: ScavengerHuntSheetProps) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<EventChallenge[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchChallenges(eventId, guestId);
    setChallenges(rows);
    setLoading(false);
  }, [eventId, guestId]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const done = challenges.filter((c) => c.completed).length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t('scavenger.title')}</Text>
              <Text style={styles.subtitle}>
                {t('scavenger.subtitle', { done, total: challenges.length })}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={tokens.color.muted} />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color={tokens.color.accent} style={{ marginVertical: 24 }} />
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              {challenges.map((c) => {
                const active = activeChallengeId === c.id;
                return (
                  <Pressable
                    key={c.id}
                    style={[styles.row, c.completed && styles.rowDone, active && styles.rowActive]}
                    onPress={() => onSelectChallenge(c.id)}
                  >
                    <Ionicons
                      name={c.completed ? 'checkmark-circle' : active ? 'camera' : 'ellipse-outline'}
                      size={22}
                      color={c.completed ? '#6ecf8a' : active ? tokens.color.accent : tokens.color.muted}
                    />
                    <View style={styles.rowText}>
                      <Text style={[styles.rowTitle, c.completed && styles.rowTitleDone]}>{c.title}</Text>
                      {c.description ? (
                        <Text style={styles.rowHint}>{c.description}</Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: tokens.color.bgSecondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '78%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.color.border,
  },
  title: {
    color: tokens.color.text,
    fontSize: 18,
    fontFamily: font.semibold,
  },
  subtitle: {
    color: tokens.color.muted,
    fontSize: 12,
    fontFamily: font.regular,
    marginTop: 4,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.bg,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  rowDone: {
    opacity: 0.75,
  },
  rowActive: {
    borderColor: 'rgba(245,233,211,0.45)',
    backgroundColor: tokens.color.accentDim,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: tokens.color.text,
    fontSize: 14,
    fontFamily: font.medium,
  },
  rowTitleDone: {
    textDecorationLine: 'line-through',
    color: tokens.color.muted,
  },
  rowHint: {
    color: tokens.color.muted,
    fontSize: 12,
    fontFamily: font.regular,
  },
});
