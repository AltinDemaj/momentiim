import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  Dimensions,
  ActivityIndicator,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LightboxVideo } from './LightboxVideo';
import { useLocale } from '@/context/LocaleContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export interface LightboxItem {
  id: string;
  url: string;
  mediaType?: 'photo' | 'video';
  slideDurationMs?: number;
  isOwn?: boolean;
}

interface MediaLightboxProps {
  items: LightboxItem[];
  initialIndex: number;
  visible: boolean;
  title?: string;
  allowDownload: boolean;
  allowShare: boolean;
  downloading?: boolean;
  sharing?: boolean;
  onClose: () => void;
  onDownload: (item: LightboxItem) => void;
  onShare: (item: LightboxItem) => void;
  onDeleteOwn?: (item: LightboxItem) => void;
}

export function MediaLightbox({
  items,
  initialIndex,
  visible,
  title,
  allowDownload,
  allowShare,
  downloading,
  sharing,
  onClose,
  onDownload,
  onShare,
  onDeleteOwn,
}: MediaLightboxProps) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<LightboxItem>>(null);
  const [index, setIndex] = useState(0);

  const current = items[index];
  const isVideo = current?.mediaType === 'video';

  useEffect(() => {
    if (!visible || items.length === 0) return;
    const next = Math.min(Math.max(initialIndex, 0), items.length - 1);
    setIndex(next);
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: next, animated: false });
    });
  }, [visible, initialIndex, items.length]);

  const onScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (!Number.isNaN(next) && next >= 0 && next < items.length) setIndex(next);
  }, [items.length]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
    const next = viewableItems[0]?.index;
    if (next != null) setIndex(next);
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const topPad = insets.top + 8;
  const bottomPad = insets.bottom + 16;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={[styles.topBar, { paddingTop: topPad }]}>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={16}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>

          <View style={styles.topCenter}>
            {title ? (
              <Text style={styles.eventTitle} numberOfLines={1}>
                {title}
              </Text>
            ) : null}
            <Text style={styles.counter}>
              {items.length > 0 ? `${index + 1} / ${items.length}` : ''}
            </Text>
            {isVideo ? <Text style={styles.typeBadge}>{t('album.reel')}</Text> : null}
          </View>

          <View style={styles.topActions}>
            {current?.isOwn && onDeleteOwn ? (
              <Pressable
                style={styles.actionBtn}
                onPress={() => onDeleteOwn(current)}
                hitSlop={10}
              >
                <Ionicons name="trash-outline" size={22} color="#F5E9D3" />
              </Pressable>
            ) : null}
            {allowShare && current ? (
              <Pressable
                style={styles.actionBtn}
                onPress={() => onShare(current)}
                disabled={sharing || downloading}
                hitSlop={10}
              >
                {sharing ? (
                  <ActivityIndicator color="#F5E9D3" size="small" />
                ) : (
                  <Ionicons name="share-outline" size={22} color="#F5E9D3" />
                )}
              </Pressable>
            ) : null}
            {allowDownload && current ? (
              <Pressable
                style={styles.actionBtn}
                onPress={() => onDownload(current)}
                disabled={downloading}
                hitSlop={10}
              >
                {downloading ? (
                  <ActivityIndicator color="#F5E9D3" size="small" />
                ) : (
                  <Ionicons
                    name={isVideo ? 'film-outline' : 'download-outline'}
                    size={22}
                    color="#F5E9D3"
                  />
                )}
              </Pressable>
            ) : null}
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={items}
          horizontal
          pagingEnabled
          bounces={false}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
          initialScrollIndex={items.length > 0 ? Math.min(initialIndex, items.length - 1) : 0}
          onMomentumScrollEnd={onScrollEnd}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScrollToIndexFailed={(info) => {
            requestAnimationFrame(() => {
              listRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: false,
              });
            });
          }}
          style={styles.list}
          renderItem={({ item, index: itemIndex }) => (
            <View style={styles.slide}>
              {item.mediaType === 'video' ? (
                itemIndex === index ? (
                  <LightboxVideo uri={item.url} />
                ) : (
                  <View style={styles.reelPlaceholder}>
                    <Ionicons name="play-circle" size={56} color="rgba(245,233,211,0.6)" />
                    <Text style={styles.reelPlaceholderText}>{t('album.reel')}</Text>
                  </View>
                )
              ) : (
                <Image source={{ uri: item.url }} style={styles.photo} resizeMode="contain" />
              )}
            </View>
          )}
        />

        <View style={[styles.bottomBar, { paddingBottom: bottomPad }]}>
          <Text style={styles.swipeHint}>{t('lightbox.swipeHint')}</Text>
          {items.length <= 24 ? (
            <View style={styles.dots}>
              {items.map((item, i) => (
                <View
                  key={item.id}
                  style={[
                    styles.dot,
                    i === index && styles.dotActive,
                    item.mediaType === 'video' && styles.dotVideo,
                  ]}
                />
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#0B0B0C',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingBottom: 10,
    zIndex: 10,
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 4,
    gap: 3,
  },
  eventTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
    maxWidth: SCREEN_W - 160,
  },
  counter: {
    color: '#F5E9D3',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontVariant: ['tabular-nums'],
  },
  typeBadge: {
    color: 'rgba(245,233,211,0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  topActions: {
    flexDirection: 'row',
    gap: 4,
    paddingTop: 4,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  slide: {
    width: SCREEN_W,
    height: SCREEN_H * 0.68,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: SCREEN_W,
    height: '100%',
  },
  reelPlaceholder: {
    flex: 1,
    width: SCREEN_W,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#141210',
  },
  reelPlaceholderText: {
    color: 'rgba(245,233,211,0.55)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 10,
    alignItems: 'center',
  },
  swipeHint: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    backgroundColor: '#F5E9D3',
    width: 16,
  },
  dotVideo: {
    backgroundColor: 'rgba(201,169,110,0.55)',
  },
});
