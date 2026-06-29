import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions, type FlashMode } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEventUpload } from '@/hooks/useEventUpload';
import { useEventVideoUpload } from '@/hooks/useEventVideoUpload';
import { useCameraQuality } from '@/hooks/useCameraQuality';
import { tokens } from '@/theme';
import { GrainOverlay } from '@/components/camera/GrainOverlay';
import { ShutterButton } from '@/components/camera/ShutterButton';
import { PinchZoomLayer } from '@/components/camera/PinchZoomLayer';
import { ZoomWheel } from '@/components/camera/ZoomWheel';
import { ViewfinderOverlay } from '@/components/ViewfinderOverlay';
import { useActiveEvent } from '@/context/ActiveEventContext';
import { useLocale } from '@/context/LocaleContext';
import { uploadErrorMessage } from '@/lib/i18n/uploadErrors';
import { ScavengerHuntSheet } from '@/components/guest/ScavengerHuntSheet';
import { AudioGuestbookModal } from '@/components/guest/AudioGuestbookModal';
import { MediaPreviewModal, type PreviewKind } from '@/components/camera/MediaPreviewModal';
import { completeChallenge, fetchGuestFeatures, type EventGuestFeatures } from '@/lib/guestFeatures';

const FLASH_CYCLE: FlashMode[] = ['off', 'auto', 'on'];
const TAB_BAR_CLEARANCE = 88;
const BOTTOM_DOCK_HEIGHT = 132;
const SCREEN_H = Dimensions.get('window').height;
const font = { medium: 'Inter_500Medium', semibold: 'Inter_600SemiBold' };

interface CameraExperienceProps {
  compact?: boolean;
}

function FeatureRailButton({
  icon,
  label,
  onPress,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable style={[styles.railBtn, active && styles.railBtnActive]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={active ? tokens.color.accent : '#fff'} />
      <Text style={[styles.railLabel, active && styles.railLabelActive]}>{label}</Text>
    </Pressable>
  );
}

export function CameraExperience({ compact }: CameraExperienceProps) {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { session, refreshSession } = useActiveEvent();
  const cameraRef = useRef<CameraView>(null);
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const recordingPulse = useRef(new Animated.Value(1)).current;
  const [permission, requestPermission] = useCameraPermissions();

  const [cameraReady, setCameraReady] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [zoom, setZoom] = useState(0);
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [recording, setRecording] = useState(false);
  const [recordingMs, setRecordingMs] = useState(0);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartedAt = useRef(0);

  const [features, setFeatures] = useState<EventGuestFeatures | null>(null);
  const [huntOpen, setHuntOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<PreviewKind>('photo');
  const [previewDurationMs, setPreviewDurationMs] = useState(0);
  const [previewUploading, setPreviewUploading] = useState(false);

  const eventId = session?.eventId ?? '';
  const guestId = session?.guestId ?? '';
  const testMode = session?.testMode ?? false;

  const { selectFromGallery, uploadAsset, isUploading, limits, refreshLimits } = useEventUpload({
    eventId,
    guestId,
  });
  const { uploadVideo, isUploading: isVideoUploading } = useEventVideoUpload({ eventId, guestId });
  const { preset, cyclePreset, qualityLabel } = useCameraQuality(cameraRef, cameraReady, facing);

  const bottomPad = Math.max(insets.bottom, 8) + TAB_BAR_CLEARANCE;
  const viewfinderTop = insets.top + 52;
  const viewfinderBottom = bottomPad + BOTTOM_DOCK_HEIGHT;
  const zoomWheelTop = useMemo(
    () => viewfinderTop + Math.max(60, (SCREEN_H - viewfinderTop - viewfinderBottom) * 0.32),
    [viewfinderTop, viewfinderBottom]
  );

  useEffect(() => {
    if (guestId) refreshLimits();
  }, [guestId, refreshLimits]);

  useEffect(() => {
    if (!eventId) return;
    fetchGuestFeatures(eventId).then(setFeatures);
  }, [eventId]);

  useEffect(() => {
    if (!recording) return undefined;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(recordingPulse, { toValue: 0.6, duration: 500, useNativeDriver: true }),
        Animated.timing(recordingPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [recording, recordingPulse]);

  const shotsLeft = limits?.guestRemaining ?? session?.photosRemaining ?? 0;
  const videosLeft = session?.videosRemaining ?? 0;
  const allowVideo = session?.allowVideo ?? false;
  const unlimited = testMode || shotsLeft > 500;

  const canShootPhoto =
    !isUploading && !isVideoUploading && (unlimited || (limits?.canUpload !== false && shotsLeft > 0)) && !!session;
  const canRecordVideo =
    allowVideo && !isUploading && !isVideoUploading && (unlimited || videosLeft > 0) && !!session && !recording;

  const displayZoom = (1 + zoom * 4).toFixed(1);
  const exposureLabel = unlimited ? '∞' : `${shotsLeft}`;

  function playShutterFlash() {
    flashOpacity.setValue(0.85);
    Animated.timing(flashOpacity, { toValue: 0, duration: 280, useNativeDriver: true }).start();
  }

  function clearRecordingTimer() {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
  }

  const handleShoot = useCallback(async () => {
    if (!cameraRef.current || !cameraReady || !session) return;
    try {
      playShutterFlash();
      const opts: { quality: number; pictureSize?: string; skipProcessing?: boolean } = {
        quality: preset.quality,
        skipProcessing: preset.quality >= 1,
      };
      if (preset.pictureSize) opts.pictureSize = preset.pictureSize;
      const photo = await cameraRef.current.takePictureAsync(opts);
      if (!photo?.uri) return;
      setPreviewKind('photo');
      setPreviewUri(photo.uri);
    } catch {
      Alert.alert(t('camera.uploadFailed'), t('camera.captureError'));
    }
  }, [cameraReady, session, preset, t]);

  const confirmPreviewUpload = useCallback(async () => {
    if (!previewUri || !session) return;
    setPreviewUploading(true);
    try {
      if (previewKind === 'video') {
        const result = await uploadVideo(previewUri, previewDurationMs);
        if (!result.success) {
          Alert.alert(t('camera.reelFailed'), uploadErrorMessage(result.error, result.message, t));
        } else {
          await refreshSession();
          setPreviewUri(null);
        }
        return;
      }

      const result = await uploadAsset(previewUri);
      if (result.error === 'PICKER_CANCELLED') return;
      if (result.success) {
        if (activeChallengeId && result.photoId) {
          await completeChallenge(activeChallengeId, guestId, result.photoId);
          setActiveChallengeId(null);
        }
        await refreshSession();
        setPreviewUri(null);
        return;
      }
      Alert.alert(t('camera.uploadFailed'), uploadErrorMessage(result.error, result.message, t));
    } catch {
      Alert.alert(
        t('camera.uploadFailed'),
        previewKind === 'video' ? t('camera.recordingError') : t('camera.captureError')
      );
    } finally {
      setPreviewUploading(false);
    }
  }, [
    previewUri,
    previewKind,
    previewDurationMs,
    session,
    uploadAsset,
    uploadVideo,
    refreshSession,
    activeChallengeId,
    guestId,
    t,
  ]);

  const startRecording = useCallback(async () => {
    if (!cameraRef.current || !cameraReady || recording) return;
    setRecording(true);
    recordingStartedAt.current = Date.now();
    setRecordingMs(0);
    recordingTimer.current = setInterval(() => {
      setRecordingMs(Date.now() - recordingStartedAt.current);
    }, 200);

    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 60, maxFileSize: 0 });
      clearRecordingTimer();
      setRecording(false);
      const durationMs = Date.now() - recordingStartedAt.current;
      if (!video?.uri) return;
      setPreviewKind('video');
      setPreviewDurationMs(durationMs);
      setPreviewUri(video.uri);
    } catch {
      clearRecordingTimer();
      setRecording(false);
      Alert.alert(t('camera.recordingError'), t('camera.tryAgain'));
    }
  }, [cameraReady, recording, t]);

  function handleShutterPress() {
    if (mode === 'photo') handleShoot();
    else if (recording) cameraRef.current?.stopRecording();
    else startRecording();
  }

  async function handleGallery() {
    const picked = await selectFromGallery();
    if ('cancelled' in picked) return;
    setPreviewKind('gallery');
    setPreviewUri(picked.uri);
  }

  function cycleFlash() {
    setFlashMode((c) => FLASH_CYCLE[(FLASH_CYCLE.indexOf(c) + 1) % FLASH_CYCLE.length]);
  }

  function toggleFacing() {
    setFacing((f) => {
      const next = f === 'back' ? 'front' : 'back';
      if (next === 'front') setFlashMode('off');
      return next;
    });
    setZoom(0);
  }

  function formatRecordingTime(ms: number) {
    const sec = Math.floor(ms / 1000);
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  }

  if (!session) {
    return (
      <View style={styles.empty}>
        <Ionicons name="camera-outline" size={48} color={tokens.color.muted} />
        <Text style={styles.emptyTitle}>{t('camera.noEvent')}</Text>
        <Text style={styles.emptyHint}>{t('camera.noEventHint')}</Text>
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>{t('camera.permission')}</Text>
        <Text style={styles.emptyHint}>{t('camera.permissionHint')}</Text>
        <Pressable style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>{t('camera.enableCamera')}</Text>
        </Pressable>
      </View>
    );
  }

  const shutterDisabled = mode === 'photo' ? !canShootPhoto : recording ? false : !canRecordVideo;
  const shutterLoading = isUploading || isVideoUploading;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        flash={flashMode}
        zoom={zoom}
        mode={mode === 'video' ? 'video' : 'picture'}
        onCameraReady={() => setCameraReady(true)}
      />

      <PinchZoomLayer
        zoom={zoom}
        onZoomChange={setZoom}
        top={viewfinderTop}
        bottom={viewfinderBottom}
      />

      <ViewfinderOverlay top={viewfinderTop} bottom={viewfinderBottom} />

      <ZoomWheel zoom={zoom} onZoomChange={setZoom} top={zoomWheelTop} label={t('camera.zoom')} />

      <GrainOverlay />
      <Animated.View style={[styles.shutterFlash, { opacity: flashOpacity }]} pointerEvents="none" />

      {zoom > 0.02 && (
        <View style={[styles.zoomBadge, { top: viewfinderTop + 24 }]}>
          <Text style={styles.zoomBadgeText}>{displayZoom}×</Text>
        </View>
      )}

      {recording && (
        <Animated.View style={[styles.recBadge, { opacity: recordingPulse }]}>
          <View style={styles.recDot} />
          <Text style={styles.recText}>{formatRecordingTime(recordingMs)}</Text>
        </Animated.View>
      )}

      {!cameraReady && (
        <View style={styles.loading}>
          <ActivityIndicator color={tokens.color.accent} />
        </View>
      )}

      {!compact && (
        <View style={[styles.topHud, { paddingTop: insets.top + 6 }]}>
          <Text style={styles.roomTitle} numberOfLines={1}>
            {session.title}
          </Text>
          <View style={styles.topMeta}>
            <Pressable
              style={styles.qualityBtn}
              onPress={cyclePreset}
              disabled={isUploading || recording}
            >
              <Text style={styles.qualityBtnText}>{qualityLabel}</Text>
            </Pressable>
            <Pressable style={styles.flashBtn} onPress={cycleFlash}>
              <Ionicons
                name={
                  flashMode === 'on'
                    ? 'flash'
                    : flashMode === 'auto'
                      ? 'flash-outline'
                      : 'flash-off-outline'
                }
                size={18}
                color={flashMode === 'off' ? 'rgba(255,255,255,0.4)' : tokens.color.accent}
              />
            </Pressable>
            <Text style={styles.exposurePill}>{exposureLabel}</Text>
          </View>
        </View>
      )}

      <View style={[styles.leftRail, { top: viewfinderTop + 8 }]}>
        {features?.featureScavengerHunt && (
          <FeatureRailButton
            icon="checkbox-outline"
            label={t('camera.iSpy')}
            active={!!activeChallengeId || huntOpen}
            onPress={() => setHuntOpen(true)}
          />
        )}
        {features?.featureAudioGuestbook && (
          <FeatureRailButton
            icon="mic-outline"
            label={t('camera.voice')}
            active={audioOpen}
            onPress={() => setAudioOpen(true)}
          />
        )}
      </View>

      <View style={[styles.bottomDock, { paddingBottom: bottomPad }]}>
        {allowVideo && (
          <View style={styles.modePill}>
            <Pressable
              style={[styles.modeSeg, mode === 'photo' && styles.modeSegOn]}
              onPress={() => setMode('photo')}
            >
              <Text style={[styles.modeSegText, mode === 'photo' && styles.modeSegTextOn]}>
                {t('camera.photo')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeSeg, mode === 'video' && styles.modeSegOn]}
              onPress={() => setMode('video')}
              disabled={!unlimited && videosLeft <= 0}
            >
              <Text style={[styles.modeSegText, mode === 'video' && styles.modeSegTextOn]}>
                {t('camera.reel')}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.controlRow}>
          <Pressable
            style={styles.sideBtn}
            onPress={handleGallery}
            disabled={!canShootPhoto || isUploading}
          >
            <Ionicons
              name="images-outline"
              size={28}
              color={canShootPhoto ? '#fff' : 'rgba(255,255,255,0.35)'}
            />
          </Pressable>

          <ShutterButton
            onPress={handleShutterPress}
            disabled={shutterDisabled}
            loading={shutterLoading}
            recording={recording || mode === 'video'}
          />

          <Pressable style={styles.sideBtn} onPress={toggleFacing}>
            <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
          </Pressable>
        </View>
      </View>

      <ScavengerHuntSheet
        visible={huntOpen}
        eventId={eventId}
        guestId={guestId}
        onClose={() => setHuntOpen(false)}
        onSelectChallenge={setActiveChallengeId}
        activeChallengeId={activeChallengeId}
      />
      <AudioGuestbookModal
        visible={audioOpen}
        eventId={eventId}
        guestId={guestId}
        remaining={features?.audioMessagesRemaining ?? 0}
        onClose={() => setAudioOpen(false)}
        onSaved={async () => {
          const refreshed = await fetchGuestFeatures(eventId);
          setFeatures(refreshed);
        }}
      />
      <MediaPreviewModal
        visible={!!previewUri}
        uri={previewUri}
        kind={previewKind}
        uploading={previewUploading}
        onRetake={() => {
          setPreviewUri(null);
          setPreviewDurationMs(0);
        }}
        onSend={confirmPreviewUpload}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
    backgroundColor: tokens.color.bg,
  },
  emptyTitle: { color: tokens.color.text, fontSize: 20, fontFamily: font.semibold },
  emptyHint: { color: tokens.color.muted, fontSize: 14, textAlign: 'center' },
  permBtn: {
    marginTop: 8,
    backgroundColor: tokens.color.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: tokens.radius.md,
  },
  permBtnText: { color: tokens.color.bg, fontFamily: font.semibold },
  shutterFlash: { ...StyleSheet.absoluteFillObject, backgroundColor: '#fff' },
  zoomBadge: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 12,
  },
  zoomBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: font.semibold,
    fontVariant: ['tabular-nums'],
  },
  recBadge: {
    position: 'absolute',
    top: '14%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(180,30,30,0.88)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 12,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  recText: { color: '#fff', fontSize: 13, fontFamily: font.medium, fontVariant: ['tabular-nums'] },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topHud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: font.semibold,
    flex: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 6,
  },
  topMeta: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  qualityBtn: {
    minWidth: 44,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(245,233,211,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  qualityBtnText: {
    color: '#F5E9D3',
    fontSize: 11,
    fontFamily: font.semibold,
    fontVariant: ['tabular-nums'],
  },
  flashBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exposurePill: {
    color: tokens.color.accent,
    fontSize: 11,
    fontFamily: font.semibold,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    fontVariant: ['tabular-nums'],
    overflow: 'hidden',
  },
  leftRail: {
    position: 'absolute',
    left: 12,
    zIndex: 22,
    gap: 14,
  },
  railBtn: { alignItems: 'center', gap: 4, width: 52 },
  railBtnActive: { opacity: 1 },
  railLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontFamily: font.medium,
    letterSpacing: 0.3,
  },
  railLabelActive: { color: tokens.color.accent },
  bottomDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modePill: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 22,
    padding: 3,
    marginBottom: 10,
  },
  modeSeg: { paddingHorizontal: 20, paddingVertical: 7, borderRadius: 18 },
  modeSegOn: { backgroundColor: 'rgba(255,255,255,0.16)' },
  modeSegText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: font.medium },
  modeSegTextOn: { color: '#fff' },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  sideBtn: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
});
