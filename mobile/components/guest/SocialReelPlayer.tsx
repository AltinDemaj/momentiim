import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { useLocale } from '@/context/LocaleContext';
import { fetchSocialReelClips } from '@/lib/guestFeatures';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const font = { medium: 'Inter_500Medium', semibold: 'Inter_600SemiBold' };

interface SocialReelPlayerProps {
  visible: boolean;
  eventId: string;
  title: string;
  onClose: () => void;
}

export function SocialReelPlayer({ visible, eventId, title, onClose }: SocialReelPlayerProps) {
  const { t } = useLocale();
  const [clips, setClips] = useState<{ id: string; url: string | null }[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    fetchSocialReelClips(eventId).then((rows) => {
      setClips(rows.filter((c) => c.url));
      setIndex(0);
      setLoading(false);
    });
  }, [visible, eventId]);

  useEffect(() => {
    if (!visible || clips.length === 0) return undefined;

    timer.current = setInterval(() => {
      setIndex((i) => (i + 1) % clips.length);
    }, 1000);

    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [visible, clips.length]);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const current = clips[index];

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.close} onPress={onClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{t('reel.playerSubtitle')}</Text>

        {loading ? (
          <ActivityIndicator color={tokens.color.accent} size="large" />
        ) : current?.url ? (
          <Image source={{ uri: current.url }} style={styles.frame} resizeMode="cover" />
        ) : (
          <Text style={styles.empty}>{t('reel.notReady')}</Text>
        )}

        <View style={styles.dots}>
          {clips.map((c, i) => (
            <View key={c.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  close: {
    position: 'absolute',
    top: 52,
    right: 20,
    zIndex: 2,
  },
  title: {
    position: 'absolute',
    top: 56,
    left: 20,
    color: '#fff',
    fontSize: 16,
    fontFamily: font.semibold,
  },
  subtitle: {
    position: 'absolute',
    top: 78,
    left: 20,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontFamily: font.medium,
  },
  frame: {
    width: SCREEN_W * 0.72,
    height: SCREEN_H * 0.62,
    borderRadius: 16,
    backgroundColor: '#111',
  },
  empty: {
    color: tokens.color.muted,
    fontFamily: font.medium,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    backgroundColor: tokens.color.accent,
    width: 16,
  },
});
