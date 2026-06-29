import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { celebration as C } from '@/theme';
import { getPlaceholderHero } from '@/lib/heroPlaceholders';
import { getRecentRooms } from '@/lib/recentRooms';
import { fetchMemoryAlbums, type MemoryAlbum } from '@/lib/events';
import { formatRevealLabelLocalized } from '@/lib/i18n/revealLabels';
import { useLocale } from '@/context/LocaleContext';

const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

function KeepsakeBox({
  album,
  onPress,
  t,
}: {
  album: MemoryAlbum;
  onPress: () => void;
  t: (key: import('@/lib/i18n').TranslationKey, params?: Record<string, string | number>) => string;
}) {
  const developed = album.status === 'developed';
  const monthYear = new Date(album.date).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <Pressable
      style={({ pressed }) => [styles.box, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.boxTop}>
        {album.coverUrl ? (
          <Image source={{ uri: album.coverUrl }} style={styles.cover} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={styles.cameraEmoji}>📦</Text>
          </View>
        )}
        <View style={styles.boxLabel}>
          <Text style={styles.boxLabelText}>{t('memories.disposableCamera')}</Text>
        </View>
      </View>
      <View style={styles.boxBody}>
        <Text style={styles.boxTitle} numberOfLines={2}>
          {album.title}
        </Text>
        <Text style={styles.boxDate}>{monthYear}</Text>
        <Text style={styles.boxMeta}>
          {developed
            ? `${album.publishedCount} ${t('memories.moments')} · ${t('memories.developedShort')}`
            : formatRevealLabelLocalized(album.revealedAt, album.revealScheduledAt, false, t)}
        </Text>
        <Text style={styles.boxAction}>
          {developed ? t('memories.tapOpen') : t('memories.developing')}
        </Text>
      </View>
    </Pressable>
  );
}

export default function MemoriesScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const [albums, setAlbums] = useState<MemoryAlbum[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const recent = await getRecentRooms();
    const data = await fetchMemoryAlbums(recent.map((r) => r.eventId));
    setAlbums(data);
  }, []);

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.color.accent} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('memories.title')}</Text>
        <Text style={styles.subtitle}>{t('memories.subtitle')}</Text>

        {albums.length === 0 ? (
          <View style={styles.empty}>
            <Image source={{ uri: getPlaceholderHero('shelf') }} style={styles.emptyImage} />
            <Text style={styles.emptyTitle}>{t('memories.emptyTitle')}</Text>
            <Text style={styles.emptyHint}>{t('memories.emptyHint')}</Text>
          </View>
        ) : (
          <View style={styles.shelf}>
            {albums.map((album) => (
              <KeepsakeBox
                key={album.eventId}
                album={album}
                t={t}
                onPress={() => router.push(`/memories/${album.eventId}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.color.bg,
  },
  scroll: {
    paddingHorizontal: C.spacing.lg,
    paddingBottom: 120,
  },
  title: {
    color: C.color.text,
    fontSize: 32,
    fontFamily: font.bold,
    letterSpacing: -0.5,
    marginTop: 8,
  },
  subtitle: {
    color: C.color.muted,
    fontSize: 14,
    fontFamily: font.regular,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: C.spacing.lg,
  },
  shelf: {
    gap: 16,
  },
  box: {
    borderRadius: C.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.color.borderStrong,
    backgroundColor: C.color.glass,
    shadowColor: '#1A1612',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  boxTop: {
    height: 200,
    backgroundColor: C.color.bgSecondary,
    position: 'relative',
  },
  boxLabel: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(26,22,18,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  boxLabelText: {
    color: C.color.accent,
    fontSize: 10,
    fontFamily: font.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraEmoji: {
    fontSize: 48,
    opacity: 0.5,
  },
  boxBody: {
    padding: 16,
    gap: 4,
  },
  boxTitle: {
    color: C.color.text,
    fontSize: 18,
    fontFamily: font.semibold,
  },
  boxDate: {
    color: C.color.muted,
    fontSize: 12,
    fontFamily: font.regular,
  },
  boxMeta: {
    color: C.color.muted,
    fontSize: 13,
    fontFamily: font.regular,
  },
  boxAction: {
    color: C.color.accent,
    fontSize: 13,
    fontFamily: font.medium,
    marginTop: 6,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  emptyImage: {
    width: '100%',
    height: 160,
    borderRadius: C.radius.lg,
    marginBottom: 8,
  },
  emptyTitle: {
    color: C.color.textSecondary,
    fontSize: 18,
    fontFamily: font.semibold,
  },
  emptyHint: {
    color: C.color.muted,
    fontSize: 14,
    fontFamily: font.regular,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 24,
  },
});
