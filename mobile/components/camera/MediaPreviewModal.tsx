import { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { useLocale } from '@/context/LocaleContext';

const font = { medium: 'Inter_500Medium', semibold: 'Inter_600SemiBold' };

export type PreviewKind = 'photo' | 'video' | 'gallery';

interface MediaPreviewModalProps {
  visible: boolean;
  uri: string | null;
  kind: PreviewKind;
  uploading: boolean;
  onRetake: () => void;
  onSend: () => void;
}

export function MediaPreviewModal({
  visible,
  uri,
  kind,
  uploading,
  onRetake,
  onSend,
}: MediaPreviewModalProps) {
  const { t } = useLocale();
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    if (!visible) {
      videoRef.current?.stopAsync().catch(() => {});
    }
  }, [visible]);

  const title =
    kind === 'video' ? t('camera.previewReelTitle') : t('camera.previewTitle');
  const hint =
    kind === 'video'
      ? t('camera.previewReelHint')
      : kind === 'gallery'
        ? t('camera.previewGalleryHint')
        : t('camera.previewHint');
  const sendLabel = kind === 'video' ? t('camera.sendReel') : t('camera.sendPhoto');

  return (
    <Modal visible={visible && !!uri} animationType="fade" transparent onRequestClose={onRetake}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.hint}>{hint}</Text>
          {uri ? (
            kind === 'video' ? (
              <Video
                ref={videoRef}
                source={{ uri }}
                style={styles.preview}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                isLooping
                shouldPlay
              />
            ) : (
              <Image source={{ uri }} style={styles.preview} resizeMode="contain" />
            )
          ) : null}
          <View style={styles.actions}>
            <Pressable style={styles.secondaryBtn} onPress={onRetake} disabled={uploading}>
              <Ionicons name="refresh-outline" size={20} color={tokens.color.muted} />
              <Text style={styles.secondaryText}>{t('camera.retake')}</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={onSend} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color={tokens.color.bg} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color={tokens.color.bg} />
                  <Text style={styles.primaryText}>{sendLabel}</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    gap: 12,
    alignItems: 'center',
  },
  title: {
    color: tokens.color.text,
    fontSize: 20,
    fontFamily: font.semibold,
  },
  hint: {
    color: tokens.color.muted,
    fontSize: 13,
    textAlign: 'center',
    fontFamily: font.medium,
    paddingHorizontal: 12,
  },
  preview: {
    width: '100%',
    height: 360,
    borderRadius: 16,
    backgroundColor: '#111',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  secondaryText: {
    color: tokens.color.muted,
    fontFamily: font.medium,
    fontSize: 15,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: tokens.color.accent,
    minHeight: 48,
  },
  primaryText: {
    color: tokens.color.bg,
    fontFamily: font.semibold,
    fontSize: 15,
  },
});
