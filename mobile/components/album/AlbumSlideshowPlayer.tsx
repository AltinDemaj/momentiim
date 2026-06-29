import { useCallback, useEffect, useRef, useState } from 'react';

import {

  View,

  Text,

  StyleSheet,

  Modal,

  Pressable,

  Image,

  Animated,

  useWindowDimensions,

  ImageBackground,

} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { LightboxVideo } from './LightboxVideo';

import type { LightboxItem } from './MediaLightbox';
import { useLocale } from '@/context/LocaleContext';



const PHOTO_SLIDE_MS = 4500;

const DOUBLE_TAP_MS = 280;

function slideMs(item: LightboxItem | undefined) {
  if (!item) return PHOTO_SLIDE_MS;
  if (item.slideDurationMs) return item.slideDurationMs;
  return item.mediaType === 'video' ? 8000 : PHOTO_SLIDE_MS;
}



interface AlbumSlideshowPlayerProps {

  items: LightboxItem[];

  visible: boolean;

  title?: string;

  onClose: () => void;

}



export function AlbumSlideshowPlayer({

  items,

  visible,

  title,

  onClose,

}: AlbumSlideshowPlayerProps) {

  const insets = useSafeAreaInsets();
  const { t } = useLocale();

  const { width: screenW, height: screenH } = useWindowDimensions();

  const isLandscape = screenW > screenH;



  const [index, setIndex] = useState(0);

  const [playing, setPlaying] = useState(true);

  const [controlsVisible, setControlsVisible] = useState(true);



  const fadeAnim = useRef(new Animated.Value(1)).current;

  const controlsOpacity = useRef(new Animated.Value(1)).current;

  const kenBurns = useRef(new Animated.Value(1)).current;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastTapRef = useRef(0);

  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);



  const current = items[index];

  const isVideo = current?.mediaType === 'video';



  const goTo = useCallback(

    (nextIndex: number) => {

      if (items.length === 0) return;

      const wrapped = ((nextIndex % items.length) + items.length) % items.length;

      Animated.sequence([

        Animated.timing(fadeAnim, { toValue: 0.35, duration: 140, useNativeDriver: true }),

        Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }),

      ]).start();

      setIndex(wrapped);

    },

    [items.length, fadeAnim]

  );



  const goNext = useCallback(() => {

    goTo(index + 1);

  }, [goTo, index]);



  const goPrev = useCallback(() => {

    goTo(index - 1);

  }, [goTo, index]);



  const toggleControls = useCallback(() => {

    setControlsVisible((v) => {

      const next = !v;

      Animated.timing(controlsOpacity, {

        toValue: next ? 1 : 0,

        duration: 280,

        useNativeDriver: true,

      }).start();

      return next;

    });

  }, [controlsOpacity]);



  const handleMediaTap = useCallback(

    (locationX: number) => {

      const now = Date.now();

      const sinceLast = now - lastTapRef.current;

      lastTapRef.current = now;



      if (sinceLast < DOUBLE_TAP_MS) {

        if (singleTapTimer.current) {

          clearTimeout(singleTapTimer.current);

          singleTapTimer.current = null;

        }

        const third = screenW / 3;

        if (locationX < third) goPrev();

        else if (locationX > screenW - third) goNext();

        return;

      }



      singleTapTimer.current = setTimeout(() => {

        if (Date.now() - lastTapRef.current >= DOUBLE_TAP_MS - 20) {

          toggleControls();

        }

        singleTapTimer.current = null;

      }, DOUBLE_TAP_MS);

    },

    [screenW, goPrev, goNext, toggleControls]

  );



  useEffect(() => {

    if (visible) {

      setIndex(0);

      setPlaying(true);

      setControlsVisible(true);

      controlsOpacity.setValue(1);

    }

  }, [visible, controlsOpacity]);



  useEffect(() => {

    if (timerRef.current) {

      clearTimeout(timerRef.current);

      timerRef.current = null;

    }

    if (!visible || !playing || !current || isVideo) return;



    timerRef.current = setTimeout(goNext, slideMs(current));

    return () => {

      if (timerRef.current) clearTimeout(timerRef.current);

    };

  }, [visible, playing, index, current, isVideo, goNext]);



  useEffect(() => {

    if (!visible || isVideo) {

      kenBurns.setValue(1);

      return;

    }

    kenBurns.setValue(1);

    const anim = Animated.timing(kenBurns, {

      toValue: 1.1,

      duration: slideMs(current),

      useNativeDriver: true,

    });

    if (playing) anim.start();

    return () => anim.stop();

  }, [visible, index, isVideo, playing, kenBurns]);



  const topPad = insets.top + 8;

  const bottomPad = insets.bottom + 16;

  const photoResize = isLandscape ? 'cover' : 'contain';



  return (

    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>

      <View style={styles.backdrop}>

        <Animated.View

          pointerEvents={controlsVisible ? 'auto' : 'none'}

          style={[styles.topBar, { paddingTop: topPad, opacity: controlsOpacity }]}

        >

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

          <View style={styles.topSpacer} />

        </Animated.View>



        <Pressable

          style={[styles.mediaWrap, isLandscape && styles.mediaWrapLandscape]}

          onPress={(e) => handleMediaTap(e.nativeEvent.locationX)}

        >

          <Animated.View style={[styles.mediaInner, { opacity: fadeAnim }]}>

            {current?.url ? (

              isVideo ? (

                <LightboxVideo

                  uri={current.url}

                  onEnded={goNext}

                  fullscreen

                  useNativeControls={controlsVisible}

                  autoPlay={playing}

                />

              ) : (

                <View style={styles.photoStage}>

                  {!isLandscape && (

                    <ImageBackground

                      source={{ uri: current.url }}

                      style={StyleSheet.absoluteFill}

                      blurRadius={28}

                      resizeMode="cover"

                    />

                  )}

                  <Animated.Image

                    source={{ uri: current.url }}

                    style={[

                      styles.photo,

                      {

                        width: screenW,

                        height: isLandscape ? screenH : screenH * 0.62,

                        transform: [{ scale: kenBurns }],

                      },

                    ]}

                    resizeMode={photoResize}

                  />

                </View>

              )

            ) : null}

          </Animated.View>

        </Pressable>



        <Animated.View

          pointerEvents={controlsVisible ? 'auto' : 'none'}

          style={[styles.bottomBar, { paddingBottom: bottomPad, opacity: controlsOpacity }]}

        >

          <Pressable style={styles.playBtn} onPress={() => setPlaying((p) => !p)}>

            <Ionicons name={playing ? 'pause' : 'play'} size={20} color="#1A1612" />

            <Text style={styles.playBtnText}>
              {playing ? t('lightbox.pauseSlideshow') : t('lightbox.resumeSlideshow')}
            </Text>

          </Pressable>

          <Text style={styles.hint}>

            Tap to hide controls · Double-tap sides for prev/next

          </Text>

        </Animated.View>

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

    position: 'absolute',

    top: 0,

    left: 0,

    right: 0,

    zIndex: 10,

    flexDirection: 'row',

    alignItems: 'flex-start',

    paddingHorizontal: 12,

    paddingBottom: 10,

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

  topSpacer: {

    width: 48,

  },

  eventTitle: {

    color: 'rgba(255,255,255,0.8)',

    fontSize: 13,

    fontWeight: '600',

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

  mediaWrap: {

    flex: 1,

    justifyContent: 'center',

  },

  mediaWrapLandscape: {

    justifyContent: 'center',

  },

  mediaInner: {

    flex: 1,

    justifyContent: 'center',

  },

  photoStage: {

    flex: 1,

    justifyContent: 'center',

    overflow: 'hidden',

    backgroundColor: '#000',

  },

  photo: {

    alignSelf: 'center',

  },

  bottomBar: {

    position: 'absolute',

    bottom: 0,

    left: 0,

    right: 0,

    zIndex: 10,

    paddingHorizontal: 24,

    paddingTop: 12,

    gap: 10,

    alignItems: 'center',

  },

  playBtn: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 8,

    backgroundColor: '#F5E9D3',

    paddingHorizontal: 22,

    paddingVertical: 12,

    borderRadius: 24,

  },

  playBtnText: {

    color: '#1A1612',

    fontSize: 14,

    fontWeight: '700',

  },

  hint: {

    color: 'rgba(255,255,255,0.4)',

    fontSize: 11,

    textAlign: 'center',

  },

});


