import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { celebration as C } from '@/theme';
import { useLocale } from '@/context/LocaleContext';

const font = { medium: 'Inter_500Medium', semibold: 'Inter_600SemiBold' };

export interface AudioMessageItem {
  id: string;
  url: string | null;
  duration_ms: number;
  created_at?: string;
}

interface AudioMessagePlayerProps {
  message: AudioMessageItem;
  label?: string;
  compact?: boolean;
  onDelete?: () => void;
}

function formatDuration(ms: number) {
  const sec = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

export function AudioMessagePlayer({ message, label, compact, onDelete }: AudioMessagePlayerProps) {
  const { t } = useLocale();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  async function togglePlay() {
    if (!message.url) return;

    if (playing && soundRef.current) {
      await soundRef.current.pauseAsync();
      setPlaying(false);
      return;
    }

    setLoading(true);
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false });

      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync({ uri: message.url });
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) setPlaying(false);
        });
      }

      await soundRef.current.playAsync();
      setPlaying(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Pressable
      style={[styles.row, compact && styles.rowCompact]}
      onPress={togglePlay}
      disabled={!message.url || loading}
    >
      {loading ? (
        <ActivityIndicator color={C.color.accent} size="small" />
      ) : (
        <Ionicons
          name={playing ? 'pause-circle' : 'play-circle'}
          size={compact ? 32 : 36}
          color={message.url ? C.color.accent : C.color.muted}
        />
      )}
      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={1}>
          {label ?? t('audio.voiceMessage')}
        </Text>
        <Text style={styles.duration}>{formatDuration(message.duration_ms)}</Text>
      </View>
      {onDelete ? (
        <Pressable onPress={onDelete} hitSlop={12} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color={C.color.danger} />
        </Pressable>
      ) : (
        <Ionicons name="mic-outline" size={16} color={C.color.muted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: C.radius.md,
    backgroundColor: C.color.glass,
    borderWidth: 1,
    borderColor: C.color.border,
  },
  rowCompact: {
    padding: 12,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: C.color.text,
    fontSize: 14,
    fontFamily: font.semibold,
  },
  duration: {
    color: C.color.muted,
    fontSize: 12,
    fontFamily: font.medium,
    fontVariant: ['tabular-nums'],
  },
  deleteBtn: {
    padding: 4,
  },
});
