import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { FilmStripBar } from './FilmStripBar';
import { useCountdown, formatEventWhen } from '@/hooks/useCountdown';
import { useLocale } from '@/context/LocaleContext';
import type { GuestEventSummary } from '@/lib/events';

const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
};

interface ActiveEventCardProps {
  event: GuestEventSummary;
  onOpenCamera: () => void;
}

export function ActiveEventCard({ event, onOpenCamera }: ActiveEventCardProps) {
  const { t, locale } = useLocale();
  const revealTarget = event.revealedAt ?? event.revealScheduledAt;
  const countdown = useCountdown(revealTarget);
  const isDeveloped = !!event.revealedAt || event.publishedCount > 0;

  function revealLabel(): string {
    if (event.revealedAt) return t('memories.developedShort');
    if (!event.revealScheduledAt) return t('memories.developing');
    if (countdown?.isPast) return t('home.revealReady');
    const d = new Date(event.revealScheduledAt);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === tomorrow.toDateString()) return t('home.revealsTomorrow');
    return t('home.revealsOn', {
      date: d.toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
    });
  }

  const whenLabel =
    formatEventWhen(event.date) === 'Tonight' ? t('home.tonight') : formatEventWhen(event.date);

  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        <Text style={styles.badge}>{t('home.activeEvent')}</Text>
        {!isDeveloped && (
          <View style={styles.liveDot}>
            <View style={styles.pulse} />
            <Text style={styles.liveText}>{t('home.collecting')}</Text>
          </View>
        )}
      </View>

      <Text style={styles.title}>{event.title}</Text>

      <View style={styles.metaRow}>
        {event.clientName ? (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color={tokens.color.muted} />
            <Text style={styles.metaText}>{event.clientName}</Text>
          </View>
        ) : null}
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={tokens.color.muted} />
          <Text style={styles.metaText}>{whenLabel}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {!isDeveloped && countdown && !countdown.isPast ? (
        <View style={styles.countdownBlock}>
          <Text style={styles.countdownEyebrow}>{t('home.developmentIn')}</Text>
          <Text style={styles.countdownTime}>{countdown.label}</Text>
        </View>
      ) : (
        <View style={styles.countdownBlock}>
          <Text style={styles.countdownEyebrow}>
            {isDeveloped ? t('home.yourMemories') : t('memories.developing')}
          </Text>
          <Text style={styles.revealStatus}>{revealLabel()}</Text>
        </View>
      )}

      <Pressable style={styles.cameraBtn} onPress={onOpenCamera}>
        <Ionicons name="camera" size={20} color={tokens.color.bg} />
        <Text style={styles.cameraBtnText}>{t('home.openCamera')}</Text>
      </Pressable>

      <View style={styles.filmWrap}>
        <FilmStripBar remaining={event.photosRemaining} total={event.perGuestLimit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.color.glass,
    borderRadius: tokens.radius.xl,
    borderWidth: 1,
    borderColor: tokens.color.borderStrong,
    padding: tokens.spacing.lg,
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    color: tokens.color.accent,
    fontSize: 10,
    fontFamily: font.semibold,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  liveDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.color.success,
  },
  liveText: {
    color: tokens.color.success,
    fontSize: 11,
    fontFamily: font.medium,
  },
  title: {
    color: tokens.color.text,
    fontSize: 26,
    fontFamily: font.extrabold,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  metaRow: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    color: tokens.color.textSecondary,
    fontSize: 14,
    fontFamily: font.regular,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.color.border,
    marginVertical: 4,
  },
  countdownBlock: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  countdownEyebrow: {
    color: tokens.color.muted,
    fontSize: 11,
    fontFamily: font.semibold,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  countdownTime: {
    color: tokens.color.accent,
    fontSize: 32,
    fontFamily: font.bold,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  revealStatus: {
    color: tokens.color.textSecondary,
    fontSize: 16,
    fontFamily: font.medium,
  },
  cameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: tokens.color.accent,
    borderRadius: tokens.radius.md,
    paddingVertical: 16,
    marginTop: 4,
  },
  cameraBtnText: {
    color: tokens.color.bg,
    fontSize: 16,
    fontFamily: font.bold,
  },
  filmWrap: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
  },
});
