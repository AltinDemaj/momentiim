import { View, Text, StyleSheet, Pressable, ImageBackground, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { celebration as C } from '@/theme';
import { ExposureCounter } from './ExposureCounter';
import { useCountdown } from '@/hooks/useCountdown';
import { useLocale } from '@/context/LocaleContext';
import type { GuestEventSummary } from '@/lib/events';
import type { TranslationKey } from '@/lib/i18n';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 48;

const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
};

function storyKeyForDate(dateIso: string): TranslationKey {
  const diff = new Date(dateIso).getTime() - Date.now();
  if (diff > 3600000) return 'home.cameraReady';
  if (diff > 0) return 'home.ceremonySoon';
  if (diff > -7200000) return 'home.ceremonyUnderway';
  return 'home.memoriesAwait';
}

interface EventStoryHeroProps {
  event: GuestEventSummary;
  onOpenCamera: () => void;
  onOpenAlbum?: () => void;
}

export function EventStoryHero({ event, onOpenCamera, onOpenAlbum }: EventStoryHeroProps) {
  const { t, locale } = useLocale();
  const revealTarget = event.revealedAt ?? event.revealScheduledAt;
  const countdown = useCountdown(revealTarget);
  const isDeveloped = !!event.revealedAt || event.publishedCount > 0;
  const d = new Date(event.date);
  const scheduleLine = `${d.toLocaleDateString(locale, { weekday: 'long' })} · ${d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}`;
  const heroUri = event.coverUrl ?? '';
  const photosUsed = Math.max(0, event.perGuestLimit - event.photosRemaining);
  const reelsUsed = event.allowVideo ? event.maxVideos - event.videosRemaining : 0;

  const albumLabel = isDeveloped
    ? t('home.viewAlbum')
    : countdown && !countdown.isPast
      ? t('home.opensIn', {
          hours: countdown.hours,
          minutes: String(countdown.minutes).padStart(2, '0'),
        })
      : t('memories.developing');

  return (
    <View style={styles.shell}>
      <ImageBackground source={{ uri: heroUri }} style={styles.hero} imageStyle={styles.coverImage}>
        <LinearGradient
          colors={['rgba(26,22,18,0.15)', 'rgba(26,22,18,0.5)', 'rgba(26,22,18,0.92)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.heroTop}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{t('home.live')}</Text>
          </View>
          {event.guestCount > 0 && (
            <View style={styles.guestPill}>
              <Ionicons name="people-outline" size={12} color="rgba(255,255,255,0.85)" />
              <Text style={styles.guestText}>{t('home.guests', { n: event.guestCount })}</Text>
            </View>
          )}
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.eyebrow}>{t('home.celebration')}</Text>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.schedule}>{scheduleLine}</Text>
          <Text style={styles.story}>{t(storyKeyForDate(event.date))}</Text>
          {event.venueName ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.75)" />
              <Text style={styles.meta}>{event.venueName}</Text>
            </View>
          ) : null}
        </View>
      </ImageBackground>

      <View style={styles.body}>
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Ionicons name="camera-outline" size={18} color={C.color.accent} />
            <Text style={styles.statChipValue}>{event.photosRemaining}</Text>
            <Text style={styles.statChipLabel}>{t('home.shotsLeft')}</Text>
          </View>
          {event.allowVideo && (
            <View style={styles.statChip}>
              <Ionicons name="videocam-outline" size={18} color={C.color.accent} />
              <Text style={styles.statChipValue}>{event.videosRemaining}</Text>
              <Text style={styles.statChipLabel}>{t('home.reelsLeft')}</Text>
            </View>
          )}
          <View style={styles.statChip}>
            <Ionicons name={isDeveloped ? 'checkmark-circle' : 'hourglass-outline'} size={18} color={C.color.accent} />
            <Text style={[styles.statChipValue, styles.statChipValueSmall]}>
              {isDeveloped ? t('home.ready') : t('home.soon')}
            </Text>
            <Text style={styles.statChipLabel}>{t('home.album')}</Text>
          </View>
        </View>

        <View style={styles.filmBlock}>
          <View style={styles.filmHeader}>
            <Text style={styles.filmLabel}>{t('home.filmRoll')}</Text>
            <Text style={styles.filmCount}>
              {photosUsed}/{event.perGuestLimit}
              {event.allowVideo ? ` · ${reelsUsed}/${event.maxVideos}` : ''}
            </Text>
          </View>
          <ExposureCounter remaining={event.photosRemaining} total={event.perGuestLimit} light compact />
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.cameraBtn, pressed && styles.btnPressed]}
            onPress={onOpenCamera}
          >
            <Ionicons name="camera" size={20} color={C.color.accent} />
            <Text style={styles.cameraBtnText}>{t('home.openCamera')}</Text>
          </Pressable>

          {isDeveloped && onOpenAlbum ? (
            <Pressable
              style={({ pressed }) => [styles.albumBtn, pressed && styles.btnPressed]}
              onPress={onOpenAlbum}
            >
              <Ionicons name="images-outline" size={20} color={C.color.accent} />
              <Text style={styles.albumBtnText}>{albumLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: CARD_W,
    alignSelf: 'center',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#1A1612',
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  hero: {
    height: 280,
    backgroundColor: '#2a2420',
    justifyContent: 'space-between',
  },
  coverImage: { resizeMode: 'cover' },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#53D769',
  },
  liveText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: font.semibold,
    letterSpacing: 0.5,
  },
  guestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  guestText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontFamily: font.medium,
  },
  heroContent: {
    padding: 20,
    paddingTop: 0,
    gap: 4,
  },
  eyebrow: {
    color: C.color.accent,
    fontSize: 11,
    fontFamily: font.semibold,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontFamily: font.extrabold,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  schedule: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontFamily: font.medium,
    marginTop: 2,
  },
  story: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontFamily: font.regular,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  meta: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontFamily: font.regular,
  },
  body: {
    padding: 18,
    gap: 16,
    backgroundColor: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.color.bg,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: C.color.border,
  },
  statChipValue: {
    color: C.color.text,
    fontSize: 20,
    fontFamily: font.bold,
    fontVariant: ['tabular-nums'],
  },
  statChipValueSmall: {
    fontSize: 15,
  },
  statChipLabel: {
    color: C.color.muted,
    fontSize: 10,
    fontFamily: font.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filmBlock: {
    gap: 8,
    backgroundColor: C.color.bg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.color.border,
  },
  filmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filmLabel: {
    color: C.color.muted,
    fontSize: 11,
    fontFamily: font.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  filmCount: {
    color: C.color.textSecondary,
    fontSize: 12,
    fontFamily: font.medium,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cameraBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(201,169,110,0.45)',
    backgroundColor: C.color.accentDim,
    paddingVertical: 16,
  },
  cameraBtnText: {
    color: C.color.accent,
    fontSize: 16,
    fontFamily: font.bold,
  },
  albumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(201,169,110,0.45)',
    backgroundColor: C.color.accentDim,
  },
  albumBtnText: {
    color: C.color.accent,
    fontSize: 14,
    fontFamily: font.semibold,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
