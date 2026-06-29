import { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { uploadAudioMessage } from '@/lib/guestFeatures';
import { useLocale } from '@/context/LocaleContext';

const font = { medium: 'Inter_500Medium', semibold: 'Inter_600SemiBold' };

type Step = 'idle' | 'recording' | 'preview';

interface AudioGuestbookModalProps {
  visible: boolean;
  eventId: string;
  guestId: string;
  remaining: number;
  onClose: () => void;
  onSaved: () => void;
}

export function AudioGuestbookModal({
  visible,
  eventId,
  guestId,
  remaining,
  onClose,
  onSaved,
}: AudioGuestbookModalProps) {
  const { t } = useLocale();
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [step, setStep] = useState<Step>('idle');
  const [uploading, setUploading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) resetAll();
    return () => {
      cleanup();
    };
  }, [visible]);

  function cleanup() {
    if (timer.current) clearInterval(timer.current);
    recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    recordingRef.current = null;
    soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;
  }

  function resetAll() {
    cleanup();
    setStep('idle');
    setUploading(false);
    setPlaying(false);
    setElapsed(0);
    setPreviewUri(null);
  }

  async function startRecording() {
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('audio.micPermission'), t('audio.micPermissionHint'));
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording: rec } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    recordingRef.current = rec;
    setStep('recording');
    setElapsed(0);
    timer.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }

  async function stopRecording() {
    if (!recordingRef.current) return;
    if (timer.current) clearInterval(timer.current);

    await recordingRef.current.stopAndUnloadAsync();
    const uri = recordingRef.current.getURI();
    recordingRef.current = null;

    if (!uri) {
      Alert.alert(t('audio.recordingError'), t('common.tryAgain'));
      setStep('idle');
      return;
    }

    setPreviewUri(uri);
    setStep('preview');
  }

  async function togglePreview() {
    if (!previewUri) return;

    if (playing && soundRef.current) {
      await soundRef.current.pauseAsync();
      setPlaying(false);
      return;
    }

    if (soundRef.current) {
      await soundRef.current.playAsync();
      setPlaying(true);
      return;
    }

    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false });
    const { sound } = await Audio.Sound.createAsync({ uri: previewUri });
    soundRef.current = sound;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        setPlaying(false);
      }
    });
    await sound.playAsync();
    setPlaying(true);
  }

  async function sendMessage() {
    if (!previewUri) return;
    setUploading(true);

    try {
      const durationMs = Math.max(elapsed * 1000, 500);
      const result = await uploadAudioMessage(eventId, guestId, previewUri, durationMs);
      if (result.success) {
        Alert.alert(t('audio.saved'), t('audio.savedHint'));
        onSaved();
        onClose();
        return;
      }
      Alert.alert(t('camera.uploadFailed'), result.message ?? t('common.tryAgain'));
    } catch {
      Alert.alert(t('audio.recordingError'), t('common.tryAgain'));
    } finally {
      setUploading(false);
    }
  }

  function discardPreview() {
    soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;
    setPlaying(false);
    setPreviewUri(null);
    setElapsed(0);
    setStep('idle');
  }

  function formatTime(sec: number) {
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('audio.title')}</Text>
          <Text style={styles.hint}>{t('audio.hint')}</Text>
          <Text style={styles.remaining}>{t('audio.remaining', { n: remaining })}</Text>

          {step === 'preview' && (
            <Pressable style={styles.previewRow} onPress={togglePreview}>
              <Ionicons
                name={playing ? 'pause-circle' : 'play-circle'}
                size={44}
                color={tokens.color.accent}
              />
              <View style={styles.previewMeta}>
                <Text style={styles.previewLabel}>{t('audio.yourRecording')}</Text>
                <Text style={styles.previewTime}>{formatTime(elapsed)}</Text>
              </View>
            </Pressable>
          )}

          {step !== 'preview' && (
            <Pressable
              style={[styles.micBtn, step === 'recording' && styles.micBtnActive]}
              onPress={step === 'recording' ? stopRecording : startRecording}
              disabled={uploading || remaining <= 0}
            >
              <Ionicons
                name={step === 'recording' ? 'stop' : 'mic'}
                size={36}
                color={tokens.color.bg}
              />
            </Pressable>
          )}

          <Text style={styles.timer}>
            {step === 'recording'
              ? formatTime(elapsed)
              : step === 'preview'
                ? t('audio.listenThenSend')
                : t('audio.tapToRecord')}
          </Text>

          {step === 'preview' && (
            <View style={styles.previewActions}>
              <Pressable style={styles.secondaryBtn} onPress={discardPreview} disabled={uploading}>
                <Text style={styles.secondaryText}>{t('audio.rerecord')}</Text>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={sendMessage} disabled={uploading}>
                {uploading ? (
                  <ActivityIndicator color={tokens.color.bg} />
                ) : (
                  <Text style={styles.primaryText}>{t('audio.send')}</Text>
                )}
              </Pressable>
            </View>
          )}

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>{t('audio.close')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: tokens.color.bgSecondary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
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
    lineHeight: 20,
    fontFamily: font.medium,
  },
  remaining: {
    color: tokens.color.accent,
    fontSize: 12,
    fontFamily: font.medium,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginTop: 4,
  },
  previewMeta: {
    flex: 1,
    gap: 2,
  },
  previewLabel: {
    color: tokens.color.text,
    fontSize: 14,
    fontFamily: font.semibold,
  },
  previewTime: {
    color: tokens.color.muted,
    fontSize: 13,
    fontFamily: font.medium,
    fontVariant: ['tabular-nums'],
  },
  micBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: tokens.color.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  micBtnActive: {
    backgroundColor: '#c44',
  },
  timer: {
    color: tokens.color.textSecondary,
    fontSize: 14,
    fontFamily: font.medium,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.color.border,
    alignItems: 'center',
  },
  secondaryText: {
    color: tokens.color.muted,
    fontFamily: font.medium,
    fontSize: 14,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: tokens.color.accent,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primaryText: {
    color: tokens.color.bg,
    fontFamily: font.semibold,
    fontSize: 14,
  },
  closeBtn: {
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeText: {
    color: tokens.color.muted,
    fontFamily: font.medium,
  },
});
