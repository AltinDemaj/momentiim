import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions, type CameraViewRef } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { uploadSelfieAndSearch } from '@/lib/guestFeatures';
import { useLocale } from '@/context/LocaleContext';

const font = { medium: 'Inter_500Medium', semibold: 'Inter_600SemiBold' };

interface FindMyPhotosSheetProps {
  visible: boolean;
  eventId: string;
  guestId: string;
  onClose: () => void;
  onOpenPhoto: (photoId: string) => void;
}

export function FindMyPhotosSheet({
  visible,
  eventId,
  guestId,
  onClose,
  onOpenPhoto,
}: FindMyPhotosSheetProps) {
  const { t } = useLocale();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraViewRef>(null);
  const [searching, setSearching] = useState(false);
  const [photos, setPhotos] = useState<{ id: string; url: string | null; is_own: boolean }[]>([]);

  async function handleSelfie() {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }

    setSearching(true);
    try {
      const shot = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
      if (!shot?.uri) {
        Alert.alert(t('find.title'), t('common.tryAgain'));
        return;
      }
      const result = await uploadSelfieAndSearch(eventId, guestId, shot.uri);
      setPhotos(result.photos);
      if (result.photos.length === 0) {
        Alert.alert(t('find.noMatches'), t('find.noMatchesHint'));
      }
    } catch {
      Alert.alert(t('find.searchFailed'), t('common.tryAgain'));
    } finally {
      setSearching(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('find.title')}</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={tokens.color.muted} />
            </Pressable>
          </View>

          <Text style={styles.hint}>{t('find.hint')}</Text>

          <View style={styles.preview}>
            {permission?.granted ? (
              <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="front" />
            ) : (
              <Pressable style={styles.perm} onPress={requestPermission}>
                <Text style={styles.permText}>{t('find.enableCamera')}</Text>
              </Pressable>
            )}
          </View>

          <Pressable style={styles.searchBtn} onPress={handleSelfie} disabled={searching}>
            {searching ? (
              <ActivityIndicator color={tokens.color.bg} />
            ) : (
              <Text style={styles.searchBtnText}>{t('find.search')}</Text>
            )}
          </Pressable>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.results}>
            {photos.map((p) =>
              p.url ? (
                <Pressable key={p.id} onPress={() => onOpenPhoto(p.id)}>
                  <Image source={{ uri: p.url }} style={styles.thumb} />
                  {p.is_own ? <Text style={styles.ownBadge}>{t('find.yours')}</Text> : null}
                </Pressable>
              ) : null
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: tokens.color.bgSecondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: tokens.color.text,
    fontSize: 18,
    fontFamily: font.semibold,
  },
  hint: {
    color: tokens.color.muted,
    fontSize: 13,
    marginBottom: 12,
    fontFamily: font.medium,
  },
  preview: {
    height: 200,
    borderRadius: tokens.radius.md,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 12,
  },
  perm: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permText: {
    color: tokens.color.accent,
    fontFamily: font.medium,
  },
  searchBtn: {
    backgroundColor: tokens.color.accent,
    paddingVertical: 14,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    marginBottom: 12,
  },
  searchBtnText: {
    color: tokens.color.bg,
    fontFamily: font.semibold,
  },
  results: {
    maxHeight: 100,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginRight: 8,
  },
  ownBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    fontSize: 9,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
});
