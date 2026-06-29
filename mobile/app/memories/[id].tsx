import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { celebration as C } from '@/theme';
import { fetchGuestEventSummary, fetchPublishedPhotos } from '@/lib/events';
import {
  downloadPhotos,
  downloadSingleMedia,
  prefetchMediaCache,
  shareSelectedMedia,
  shareSingleMedia,
  type ShareStage,
} from '@/lib/albumActions';
import { useCountdown } from '@/hooks/useCountdown';
import { MediaLightbox, type LightboxItem } from '@/components/album/MediaLightbox';
import { AlbumSlideshowPlayer } from '@/components/album/AlbumSlideshowPlayer';
import { AlbumControlsPanel, type MediaFilter } from '@/components/album/AlbumControlsPanel';
import { BusyOverlay } from '@/components/album/BusyOverlay';
import { PoweredByBanner } from '@/components/guest/PoweredByBanner';
import { FindMyPhotosSheet } from '@/components/guest/FindMyPhotosSheet';
import { SocialReelPlayer } from '@/components/guest/SocialReelPlayer';
import {
  fetchGuestFeatures,
  fetchMyAudioMessages,
  deleteGuestPhoto,
  deleteGuestAudioMessage,
  type EventGuestFeatures,
} from '@/lib/guestFeatures';
import { AudioMessagePlayer } from '@/components/guest/AudioMessagePlayer';
import { useLocale } from '@/context/LocaleContext';

const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
};

const SCREEN_W = Dimensions.get('window').width;
const COL_GAP = 6;
const COL_SIZE = (SCREEN_W - 32 - COL_GAP) / 2;

type MediaItem = {
  id: string;
  url: string | null;
  mediaType?: string;
  slideDurationMs?: number;
  isOwn?: boolean;
};

function toLightboxItem(p: MediaItem): LightboxItem | null {
  if (!p.url) return null;
  return {
    id: p.id,
    url: p.url,
    mediaType: p.mediaType === 'video' ? 'video' : 'photo',
    slideDurationMs: p.slideDurationMs,
    isOwn: p.isOwn,
  };
}

function shareStageCopy(
  stage: ShareStage,
  t: (key: import('@/lib/i18n').TranslationKey, params?: Record<string, string | number>) => string
): { message: string; submessage?: string } {
  if (stage === 'opening') {
    return { message: t('share.opening'), submessage: t('share.chooseWhere') };
  }
  if (stage === 'loading') {
    return { message: t('share.loadingMoment'), submessage: t('share.chooseWhere') };
  }
  return { message: t('share.preparing'), submessage: t('share.justMoment') };
}

export default function AlbumScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = Array.isArray(id) ? id[0] : id;

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState<{ message: string; submessage?: string } | null>(null);
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [venueName, setVenueName] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [revealScheduledAt, setRevealScheduledAt] = useState<string | null>(null);
  const [revealedAt, setRevealedAt] = useState<string | null>(null);
  const [allowDownload, setAllowDownload] = useState(false);
  const [allowShare, setAllowShare] = useState(false);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [features, setFeatures] = useState<EventGuestFeatures | null>(null);
  const [findOpen, setFindOpen] = useState(false);
  const [reelOpen, setReelOpen] = useState(false);
  const [guestId, setGuestId] = useState('');
  const [audioMessages, setAudioMessages] = useState<
    { id: string; url: string | null; duration_ms: number }[]
  >([]);

  const countdown = useCountdown(revealedAt ?? revealScheduledAt);
  const isDeveloped = photos.length > 0 || !!revealedAt;

  const lightboxItems = useMemo(
    () =>
      photos
        .map(toLightboxItem)
        .filter((p): p is LightboxItem => p !== null),
    [photos]
  );

  const photoItems = useMemo(
    () => lightboxItems.filter((p) => p.mediaType !== 'video'),
    [lightboxItems]
  );

  const reels = useMemo(
    () => lightboxItems.filter((p) => p.mediaType === 'video'),
    [lightboxItems]
  );

  const filteredGrid = useMemo(() => {
    if (mediaFilter === 'photos') return photos.filter((p) => p.mediaType !== 'video');
    if (mediaFilter === 'videos') return photos.filter((p) => p.mediaType === 'video');
    return photos;
  }, [photos, mediaFilter]);

  const load = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    const summary = await fetchGuestEventSummary(eventId);
    if (summary) {
      setTitle(summary.title);
      setClientName(summary.clientName);
      setDate(summary.date);
      setVenueName(summary.venueName);
      setCoverUrl(summary.coverUrl);
      setRevealScheduledAt(summary.revealScheduledAt);
      setRevealedAt(summary.revealedAt);
      setAllowDownload(summary.allowDownload);
      setAllowShare(summary.allowShare);
      setGuestId(summary.guestId);
    }
    const published = await fetchPublishedPhotos(eventId);
    const gid = summary?.guestId ?? '';
    setPhotos(
      published.map((p) => ({
        id: p.id,
        url: p.url,
        mediaType: p.media_type,
        slideDurationMs: p.slide_duration_ms ?? undefined,
        isOwn: !!gid && p.uploaded_by_guest_id === gid,
      }))
    );
    const feat = await fetchGuestFeatures(eventId);
    setFeatures(feat);
    if (feat?.featureAudioGuestbook && summary?.guestId) {
      const audio = await fetchMyAudioMessages(eventId, summary.guestId);
      setAudioMessages(
        audio.map((a) => ({ id: a.id, url: a.url, duration_ms: a.duration_ms }))
      );
    }
    setSelected(new Set());
    setSelectMode(false);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    for (const id of selected) {
      const item = lightboxItems.find((p) => p.id === id);
      if (item) prefetchMediaCache(item);
    }
  }, [selected, lightboxItems]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const item = lightboxItems[lightboxIndex];
    if (item) prefetchMediaCache(item);
  }, [lightboxOpen, lightboxIndex, lightboxItems]);

  function toggleSelect(photoId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else {
        next.add(photoId);
        const item = lightboxItems.find((p) => p.id === photoId);
        if (item) prefetchMediaCache(item);
      }
      return next;
    });
  }

  function openLightbox(item: MediaItem) {
    const idx = lightboxItems.findIndex((p) => p.id === item.id);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxOpen(true);
  }

  function handleMediaPress(photo: MediaItem) {
    if (!photo.url) return;

    if (selectMode) {
      toggleSelect(photo.id);
      return;
    }

    openLightbox(photo);
  }

  function confirmDeletePhoto(item: LightboxItem) {
    if (!guestId) return;
    Alert.alert(t('delete.photoTitle'), t('delete.photoMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          const result = await deleteGuestPhoto(item.id, guestId);
          if (result.success) {
            setLightboxOpen(false);
            await load();
            Alert.alert(t('delete.success'));
          } else {
            Alert.alert(t('delete.failed'), result.message ?? t('common.tryAgain'));
          }
        },
      },
    ]);
  }

  function confirmDeleteAudio(messageId: string) {
    if (!guestId) return;
    Alert.alert(t('delete.audioTitle'), t('delete.audioMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          const result = await deleteGuestAudioMessage(messageId, guestId);
          if (result.success) {
            await load();
            Alert.alert(t('delete.success'));
          } else {
            Alert.alert(t('delete.failed'), result.message ?? t('common.tryAgain'));
          }
        },
      },
    ]);
  }

  async function handleDownloadOne(item: LightboxItem) {
    setDownloading(true);
    setBusy({
      message: t('album.savingLibrary'),
      submessage:
        item.mediaType === 'video' ? t('album.downloadingReel') : t('album.downloadingPhoto'),
    });
    const ok = await downloadSingleMedia(item);
    setDownloading(false);
    setBusy(null);
    Alert.alert(
      ok ? t('album.saved') : t('album.couldNotSave'),
      ok
        ? t('album.savedMoment', { type: item.mediaType === 'video' ? t('album.reel') : t('memories.moments') })
        : t('album.checkPermissions')
    );
  }

  async function handleShareOne(item: LightboxItem) {
    setSharing(true);
    setBusy(shareStageCopy('preparing', t));

    const shared = await shareSingleMedia(item, title, (stage) => {
      setBusy(shareStageCopy(stage, t));
    });

    setSharing(false);
    setBusy(null);
    if (!shared) {
      Alert.alert(t('album.couldNotShare'), t('album.sharingUnavailable'));
    }
  }

  async function handleDownloadSelected() {
    const items = lightboxItems.filter((p) => selected.has(p.id));
    if (items.length === 0) {
      Alert.alert(t('album.selectMoments'), t('album.selectMomentsHint'));
      return;
    }
    setDownloading(true);
    setBusy({
      message: t('album.savingCount', { n: items.length }),
      submessage: t('album.toCameraRoll'),
    });
    const { saved, failed } = await downloadPhotos(items);
    setDownloading(false);
    setBusy(null);
    setSelectMode(false);
    setSelected(new Set());
    Alert.alert(
      t('album.saved'),
      failed
        ? t('album.partialSaved', { saved, failed })
        : t('album.savedMoment', { type: String(items.length) })
    );
  }

  async function handleDownloadAll() {
    if (lightboxItems.length === 0) return;
    Alert.alert(t('album.saveEntireAlbum'), t('album.saveAllConfirm', { n: lightboxItems.length }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('album.saveAll'),
        onPress: async () => {
          setDownloading(true);
          setBusy({
            message: t('album.savingCount', { n: lightboxItems.length }),
            submessage: t('share.justMoment'),
          });
          const { saved, failed } = await downloadPhotos(lightboxItems);
          setDownloading(false);
          setBusy(null);
          Alert.alert(
            t('album.albumSaved'),
            failed
              ? t('album.partialSaved', { saved, failed })
              : t('album.savedMoment', { type: String(saved) })
          );
        },
      },
    ]);
  }

  async function handleShare() {
    const items =
      selectMode && selected.size > 0
        ? lightboxItems.filter((p) => selected.has(p.id))
        : lightboxItems;

    if (items.length === 0) return;

    setSharing(true);
    setBusy(shareStageCopy('preparing', t));

    const shared =
      items.length === 1
        ? await shareSingleMedia(items[0], title, (stage) => setBusy(shareStageCopy(stage, t)))
        : await shareSelectedMedia(title, items, (stage) => setBusy(shareStageCopy(stage, t)));

    setSharing(false);
    setBusy(null);

    if (!shared) {
      Alert.alert(t('album.couldNotShare'), t('album.sharingUnavailable'));
    }
  }

  function toggleSelectMode() {
    if (selectMode) {
      setSelectMode(false);
      setSelected(new Set());
    } else {
      setSelectMode(true);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={C.color.accent} />
      </SafeAreaView>
    );
  }

  const heroUri = coverUrl ?? photoItems[0]?.url ?? null;
  const formattedDate = new Date(date).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={styles.root}>
      <BusyOverlay
        visible={!!busy}
        message={busy?.message ?? ''}
        submessage={busy?.submessage}
      />

      <MediaLightbox
        items={lightboxItems}
        initialIndex={lightboxIndex}
        visible={lightboxOpen}
        title={title}
        allowDownload={allowDownload}
        allowShare={allowShare}
        downloading={downloading}
        sharing={sharing}
        onClose={() => setLightboxOpen(false)}
        onDownload={handleDownloadOne}
        onShare={handleShareOne}
        onDeleteOwn={confirmDeletePhoto}
      />

      <AlbumSlideshowPlayer
        items={lightboxItems}
        visible={slideshowOpen}
        title={title}
        onClose={() => setSlideshowOpen(false)}
      />

      <SocialReelPlayer
        visible={reelOpen}
        eventId={eventId ?? ''}
        title={title}
        onClose={() => setReelOpen(false)}
      />

      <FindMyPhotosSheet
        visible={findOpen}
        eventId={eventId ?? ''}
        guestId={guestId}
        onClose={() => setFindOpen(false)}
        onOpenPhoto={(photoId) => {
          const idx = lightboxItems.findIndex((p) => p.id === photoId);
          if (idx >= 0) {
            setLightboxIndex(idx);
            setLightboxOpen(true);
          }
          setFindOpen(false);
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.heroWrap}>
          {heroUri ? (
            <ImageBackground source={{ uri: heroUri }} style={styles.hero} imageStyle={styles.heroImage}>
              <LinearGradient
                colors={['transparent', 'rgba(26,22,18,0.55)', 'rgba(26,22,18,0.92)']}
                style={StyleSheet.absoluteFillObject}
              />
            </ImageBackground>
          ) : (
            <View style={[styles.hero, styles.heroPlaceholder]}>
              <Text style={styles.heroEmoji}>🎞</Text>
            </View>
          )}

          <SafeAreaView edges={['top']} style={styles.heroOverlay}>
            <View style={styles.heroNav}>
              <Pressable style={styles.navBtn} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </Pressable>
              {selectMode && (
                <View style={styles.selectBadge}>
                  <Text style={styles.selectBadgeText}>{t('album.selected', { n: selected.size })}</Text>
                </View>
              )}
            </View>

            <View style={styles.heroText}>
              <Text style={styles.heroEyebrow}>{t('album.keepsakeAlbum')}</Text>
              <Text style={styles.heroTitle}>{title}</Text>
              <Text style={styles.heroDate}>{formattedDate}</Text>
              {venueName ? (
                <View style={styles.heroVenue}>
                  <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.heroVenueText}>{venueName}</Text>
                </View>
              ) : null}
              {clientName ? (
                <Text style={styles.heroHost}>{t('album.hostedBy', { name: clientName })}</Text>
              ) : null}
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          <View style={styles.statsRow}>
            <Text style={styles.statsSummary}>
              <Text style={styles.statsSummaryBold}>{photoItems.length}</Text> {t('memories.moments')}
              {reels.length > 0 ? (
                <>
                  {' · '}
                  <Text style={styles.statsSummaryBold}>{reels.length}</Text> {t('album.reels')}
                </>
              ) : null}
              {' · '}
              <Text style={styles.statsSummaryAccent}>
                {isDeveloped ? t('memories.developedShort') : t('memories.developing')}
              </Text>
            </Text>
          </View>

          {isDeveloped && features && (features.featureSocialReel || features.featureFaceSearch) && (
            <View style={styles.featureRow}>
              {features.featureSocialReel && features.socialReelReady ? (
                <Pressable style={styles.featureBtn} onPress={() => setReelOpen(true)}>
                  <Ionicons name="logo-instagram" size={18} color={C.color.accent} />
                  <Text style={styles.featureBtnText}>{t('album.watchReel')}</Text>
                </Pressable>
              ) : null}
              {features.featureFaceSearch ? (
                <Pressable style={styles.featureBtn} onPress={() => setFindOpen(true)}>
                  <Ionicons name="scan-outline" size={18} color={C.color.accent} />
                  <Text style={styles.featureBtnText}>{t('album.findPhotos')}</Text>
                </Pressable>
              ) : null}
            </View>
          )}

          {isDeveloped && audioMessages.length > 0 && (
            <View style={styles.audioSection}>
              <Text style={styles.audioTitle}>{t('album.yourVoice')}</Text>
              <Text style={styles.audioHint}>{t('album.voiceHint')}</Text>
              <View style={styles.audioList}>
                {audioMessages.map((msg, i) => (
                  <AudioMessagePlayer
                    key={msg.id}
                    message={msg}
                    label={`${t('audio.voiceMessage')} ${audioMessages.length - i}`}
                    compact
                    onDelete={() => confirmDeleteAudio(msg.id)}
                  />
                ))}
              </View>
            </View>
          )}

          {isDeveloped && (
            <AlbumControlsPanel
              mediaFilter={mediaFilter}
              onMediaFilterChange={setMediaFilter}
              photoCount={photoItems.length}
              reelCount={reels.length}
              totalItems={lightboxItems.length}
              canSlideshow={lightboxItems.length > 1}
              onSlideshow={() => setSlideshowOpen(true)}
              selectMode={selectMode}
              selectedCount={selected.size}
              mediaCount={lightboxItems.length}
              allowDownload={allowDownload}
              allowShare={allowShare}
              downloading={downloading}
              sharing={sharing}
              onToggleSelect={toggleSelectMode}
              onSaveAll={handleDownloadAll}
              onSaveSelected={handleDownloadSelected}
              onShare={handleShare}
            />
          )}

          {!allowDownload && !allowShare && isDeveloped && (
            <Text style={styles.permissionHint}>{t('album.viewOnly')}</Text>
          )}

          {!isDeveloped ? (
            <View style={styles.developing}>
              <Text style={styles.developingEmoji}>🎞</Text>
              <Text style={styles.developingTitle}>{t('album.developing')}</Text>
              <Text style={styles.developingHint}>{t('album.developingHint')}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.gridTitle}>
                {selectMode ? t('album.selectMode') : t('album.selectHint')}
              </Text>

              {filteredGrid.length === 0 && (
                <View style={styles.emptyAlbum}>
                  <Text style={styles.emptyAlbumTitle}>{t('album.emptyTitle')}</Text>
                  <Text style={styles.emptyAlbumHint}>{t('album.emptyHint')}</Text>
                </View>
              )}

              <View style={styles.grid}>
                {filteredGrid.map((photo) =>
                  photo.url ? (
                    <Pressable
                      key={photo.id}
                      style={({ pressed }) => [
                        styles.thumbWrap,
                        pressed && styles.thumbPressed,
                        selectMode && selected.has(photo.id) && styles.thumbSelected,
                      ]}
                      onPress={() => handleMediaPress(photo)}
                      onLongPress={() => {
                        if (!selectMode && allowDownload) {
                          setSelectMode(true);
                          toggleSelect(photo.id);
                        }
                      }}
                    >
                      {photo.mediaType === 'video' ? (
                        <View style={[styles.thumb, styles.videoThumb]}>
                          <View style={styles.playCircle}>
                            <Ionicons name="play" size={22} color="#fff" />
                          </View>
                          <Text style={styles.reelLabel}>{t('album.reel')}</Text>
                        </View>
                      ) : (
                        <Image source={{ uri: photo.url }} style={styles.thumb} />
                      )}

                      {selectMode && (
                        <View
                          style={[styles.checkRing, selected.has(photo.id) && styles.checkRingOn]}
                        >
                          {selected.has(photo.id) && (
                            <Ionicons name="checkmark" size={16} color="#1A1612" />
                          )}
                        </View>
                      )}

                      {!selectMode && (
                        <View style={styles.expandHint}>
                          <Ionicons
                            name={photo.mediaType === 'video' ? 'play-circle-outline' : 'expand-outline'}
                            size={14}
                            color="#fff"
                          />
                        </View>
                      )}
                    </Pressable>
                  ) : null
                )}
              </View>

              {filteredGrid.length === 0 && (
                <Text style={styles.emptyFilter}>
                  No {mediaFilter === 'photos' ? 'photos' : 'videos'} in this album yet.
                </Text>
              )}
            </>
          )}

          <PoweredByBanner visible={features?.showReferralBanner ?? true} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.color.bg },
  center: { flex: 1, backgroundColor: C.color.bg, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 48 },
  heroWrap: {
    height: 340,
    backgroundColor: C.color.bgSecondary,
  },
  hero: {
    width: '100%',
    height: '100%',
  },
  heroImage: { resizeMode: 'cover' },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.color.bgSecondary,
  },
  heroEmoji: { fontSize: 64, opacity: 0.35 },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 4,
    gap: 8,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBadge: {
    backgroundColor: C.color.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: C.radius.pill,
  },
  selectBadgeText: {
    color: '#1A1612',
    fontSize: 12,
    fontFamily: font.semibold,
  },
  heroText: {
    padding: C.spacing.lg,
    paddingBottom: C.spacing.xl,
    gap: 4,
  },
  heroEyebrow: {
    color: C.color.accent,
    fontSize: 11,
    fontFamily: font.semibold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 32,
    fontFamily: font.extrabold,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  heroDate: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    fontFamily: font.medium,
    marginTop: 4,
  },
  heroVenue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  heroVenueText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: font.regular,
  },
  heroHost: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontFamily: font.regular,
    marginTop: 2,
  },
  body: {
    marginTop: -20,
    backgroundColor: C.color.bg,
    borderTopLeftRadius: C.radius.xl,
    borderTopRightRadius: C.radius.xl,
    paddingTop: C.spacing.lg,
    minHeight: 400,
  },
  statsRow: {
    paddingHorizontal: C.spacing.lg,
    paddingTop: 2,
    paddingBottom: 2,
  },
  statsSummary: {
    color: C.color.muted,
    fontSize: 13,
    fontFamily: font.regular,
    textAlign: 'center',
  },
  statsSummaryBold: {
    color: C.color.text,
    fontFamily: font.bold,
  },
  statsSummaryAccent: {
    color: C.color.accent,
    fontFamily: font.semibold,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: C.spacing.lg,
    marginTop: 12,
  },
  featureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: C.radius.pill,
    backgroundColor: C.color.accentDim,
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.35)',
  },
  featureBtnText: {
    color: C.color.text,
    fontSize: 13,
    fontFamily: font.semibold,
  },
  audioSection: {
    marginTop: 16,
    marginHorizontal: C.spacing.lg,
    padding: 14,
    borderRadius: C.radius.md,
    backgroundColor: C.color.card,
    borderWidth: 1,
    borderColor: C.color.border,
    gap: 8,
  },
  audioList: {
    gap: 8,
    marginTop: 4,
  },
  audioTitle: {
    color: C.color.text,
    fontSize: 14,
    fontFamily: font.semibold,
  },
  audioHint: {
    color: C.color.muted,
    fontSize: 12,
    fontFamily: font.regular,
    marginTop: 4,
  },
  permissionHint: {
    color: C.color.muted,
    fontSize: 13,
    fontFamily: font.regular,
    textAlign: 'center',
    paddingHorizontal: C.spacing.lg,
    marginTop: 12,
    fontStyle: 'italic',
  },
  developing: {
    alignItems: 'center',
    padding: C.spacing.xl,
    gap: 10,
  },
  developingEmoji: { fontSize: 48 },
  developingTitle: {
    color: C.color.text,
    fontSize: 22,
    fontFamily: font.bold,
    textAlign: 'center',
  },
  developingHint: {
    color: C.color.muted,
    fontSize: 14,
    fontFamily: font.regular,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  gridTitle: {
    color: C.color.muted,
    fontSize: 12,
    fontFamily: font.medium,
    letterSpacing: 0.3,
    paddingHorizontal: C.spacing.lg,
    marginTop: 16,
    marginBottom: 10,
  },
  emptyAlbum: {
    marginHorizontal: C.spacing.lg,
    marginBottom: 12,
    padding: 16,
    borderRadius: C.radius.md,
    backgroundColor: C.color.glass,
    borderWidth: 1,
    borderColor: C.color.border,
    gap: 8,
  },
  emptyAlbumTitle: {
    color: C.color.text,
    fontSize: 15,
    fontFamily: font.semibold,
  },
  emptyAlbumHint: {
    color: C.color.muted,
    fontSize: 13,
    fontFamily: font.regular,
    lineHeight: 20,
  },
  emptyFilter: {
    color: C.color.muted,
    fontSize: 14,
    fontFamily: font.regular,
    textAlign: 'center',
    paddingVertical: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: COL_GAP,
  },
  thumbWrap: {
    width: COL_SIZE,
    height: COL_SIZE * 1.15,
    borderRadius: C.radius.md,
    overflow: 'hidden',
    backgroundColor: C.color.bgSecondary,
    shadowColor: '#1A1612',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  thumbPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  thumbSelected: {
    borderWidth: 3,
    borderColor: C.color.accent,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  videoThumb: {
    backgroundColor: '#1A1612',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  reelLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontFamily: font.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  checkRing: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkRingOn: {
    backgroundColor: C.color.accent,
    borderColor: C.color.accent,
  },
  expandHint: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 8,
    padding: 5,
  },
});
