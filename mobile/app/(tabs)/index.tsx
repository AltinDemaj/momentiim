import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Image,
  ImageBackground,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { celebration as C } from '@/theme';
import { useActiveEvent } from '@/context/ActiveEventContext';
import { EventStoryHero } from '@/components/home/EventStoryHero';
import { getDisplayName } from '@/lib/profile';
import { getRecentRooms } from '@/lib/recentRooms';
import { fetchMemoryAlbums, type MemoryAlbum } from '@/lib/events';
import { formatRevealLabelLocalized } from '@/lib/i18n/revealLabels';
import { getPlaceholderHero } from '@/lib/heroPlaceholders';
import { useLocale } from '@/context/LocaleContext';

const KEEPSAKE_W = 148;

const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
};

function KeepsakeCard({
  album,
  onPress,
  momentsLabel,
  openLabel,
  revealLabel,
}: {
  album: MemoryAlbum;
  onPress: () => void;
  momentsLabel: string;
  openLabel: string;
  revealLabel: string;
}) {
  const developed = album.status === 'developed';

  return (
    <Pressable
      style={({ pressed }) => [styles.keepsakeCard, pressed && styles.pressed]}
      onPress={onPress}
    >
      {album.coverUrl ? (
        <Image source={{ uri: album.coverUrl }} style={styles.keepsakeImage} />
      ) : (
        <View style={styles.keepsakePlaceholder}>
          <Ionicons name="images-outline" size={28} color={C.color.muted} />
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(26,22,18,0.85)']}
        style={styles.keepsakeGradient}
      />
      <View style={styles.keepsakeOverlay}>
        <Text style={styles.keepsakeTitle} numberOfLines={2}>
          {album.title}
        </Text>
        <Text style={styles.keepsakeMeta}>
          {developed
            ? `${album.publishedCount} ${momentsLabel}`
            : revealLabel}
        </Text>
      </View>
      {developed && (
        <View style={styles.keepsakeReady}>
          <Text style={styles.keepsakeReadyText}>{openLabel}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { session, loading, refreshSession } = useActiveEvent();
  const [displayName, setDisplayName] = useState('Guest');
  const [memories, setMemories] = useState<MemoryAlbum[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const name = await getDisplayName();
    setDisplayName(name);
    await refreshSession();
    const recent = await getRecentRooms();
    const albums = await fetchMemoryAlbums(recent.map((r) => r.eventId));
    setMemories(albums.filter((a) => a.eventId !== session?.eventId));
  }, [refreshSession, session?.eventId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const isDeveloped = session && (!!session.revealedAt || session.publishedCount > 0);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#F5EDE0', C.color.bg, C.color.bg]}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.color.accent} />
          }
        >
          <View style={styles.topBar}>
            <View>
              <Text style={styles.brand}>{t('home.brand')}</Text>
              <Text style={styles.greeting}>
                {session ? t('home.guest', { name: displayName }) : t('home.greeting')}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              onPress={() => router.push('/join')}
            >
              <Ionicons name="qr-code-outline" size={22} color={C.color.text} />
            </Pressable>
          </View>

          {loading && !session ? (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>{t('home.loading')}</Text>
            </View>
          ) : session ? (
            <EventStoryHero
              event={session}
              onOpenCamera={() => router.push('/(tabs)/camera')}
              onOpenAlbum={
                isDeveloped
                  ? () => router.push(`/memories/${session.eventId}` as never)
                  : undefined
              }
            />
          ) : (
            <View style={styles.noEventShell}>
              <ImageBackground
                source={{ uri: getPlaceholderHero() }}
                style={styles.noEventHero}
                imageStyle={styles.noEventHeroImage}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(26,22,18,0.75)']}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={styles.noEventHeroTitle}>{t('home.noEvent')}</Text>
                <Text style={styles.noEventHeroSub}>{t('home.joinCelebration')}</Text>
              </ImageBackground>
              <Pressable
                style={({ pressed }) => [styles.joinPrimary, pressed && styles.pressed]}
                onPress={() => router.push('/join')}
              >
                <Ionicons name="qr-code-outline" size={20} color="#1A1612" />
                <Text style={styles.joinPrimaryText}>{t('home.joinEvent')}</Text>
              </Pressable>
            </View>
          )}

          {memories.length > 0 && (
            <View style={styles.keepsakesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('home.moreKeepsakes')}</Text>
                <Pressable onPress={() => router.push('/(tabs)/memories')}>
                  <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.keepsakeScroll}
              >
                {memories.slice(0, 6).map((album) => (
                  <KeepsakeCard
                    key={album.eventId}
                    album={album}
                    momentsLabel={t('memories.moments')}
                    openLabel={t('home.open')}
                    revealLabel={formatRevealLabelLocalized(
                      album.revealedAt,
                      album.revealScheduledAt,
                      false,
                      t
                    )}
                    onPress={() => router.push(`/memories/${album.eventId}` as never)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {memories.length === 0 && session && (
            <View style={styles.hintCard}>
              <Ionicons name="albums-outline" size={24} color={C.color.accent} />
              <Text style={styles.hintTitle}>One event, one story</Text>
              <Text style={styles.hintText}>
                Join more celebrations and each becomes its own keepsake album.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.color.bg },
  safe: { flex: 1 },
  scroll: {
    paddingBottom: 120,
    gap: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: C.spacing.lg,
    paddingTop: 8,
  },
  brand: {
    color: C.color.accent,
    fontSize: 11,
    fontFamily: font.semibold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  greeting: {
    color: C.color.text,
    fontSize: 24,
    fontFamily: font.extrabold,
    letterSpacing: -0.5,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.color.border,
    shadowColor: '#1A1612',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  placeholder: { padding: 48, alignItems: 'center' },
  placeholderText: { color: C.color.muted, fontFamily: font.regular },
  noEventShell: {
    marginHorizontal: C.spacing.lg,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#1A1612',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  noEventHero: {
    height: 220,
    justifyContent: 'flex-end',
    padding: 20,
  },
  noEventHeroImage: { resizeMode: 'cover' },
  noEventHeroTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: font.bold,
    zIndex: 1,
  },
  noEventHeroSub: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    fontFamily: font.regular,
    marginTop: 6,
    zIndex: 1,
    lineHeight: 20,
  },
  joinPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.color.accent,
    margin: 16,
    borderRadius: 16,
    paddingVertical: 16,
  },
  joinPrimaryText: {
    color: '#1A1612',
    fontSize: 16,
    fontFamily: font.bold,
  },
  keepsakesSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: C.spacing.lg,
  },
  sectionTitle: {
    color: C.color.text,
    fontSize: 18,
    fontFamily: font.bold,
  },
  seeAll: {
    color: C.color.accent,
    fontSize: 14,
    fontFamily: font.semibold,
  },
  keepsakeScroll: {
    paddingHorizontal: C.spacing.lg,
    gap: 12,
  },
  keepsakeCard: {
    width: KEEPSAKE_W,
    height: 196,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: C.color.bgSecondary,
  },
  keepsakeImage: {
    width: '100%',
    height: '100%',
  },
  keepsakePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.color.bgSecondary,
  },
  keepsakeGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  keepsakeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    gap: 2,
  },
  keepsakeTitle: {
    color: '#fff',
    fontSize: 14,
    fontFamily: font.bold,
    lineHeight: 18,
  },
  keepsakeMeta: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontFamily: font.regular,
  },
  keepsakeReady: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: C.color.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  keepsakeReadyText: {
    color: '#1A1612',
    fontSize: 10,
    fontFamily: font.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hintCard: {
    marginHorizontal: C.spacing.lg,
    alignItems: 'center',
    gap: 8,
    padding: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: C.color.border,
  },
  hintTitle: {
    color: C.color.text,
    fontSize: 16,
    fontFamily: font.semibold,
  },
  hintText: {
    color: C.color.muted,
    fontSize: 13,
    fontFamily: font.regular,
    textAlign: 'center',
    lineHeight: 19,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
});
