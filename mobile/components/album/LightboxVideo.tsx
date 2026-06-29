import { useEffect, useRef } from 'react';

import { View, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';

import { Video, ResizeMode, Audio, type AVPlaybackStatus } from 'expo-av';



interface LightboxVideoProps {

  uri: string;

  autoPlay?: boolean;

  onEnded?: () => void;

  fullscreen?: boolean;

  useNativeControls?: boolean;

}



export function LightboxVideo({

  uri,

  autoPlay = true,

  onEnded,

  fullscreen = false,

  useNativeControls = true,

}: LightboxVideoProps) {

  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;

  const videoRef = useRef<Video>(null);

  const onEndedRef = useRef(onEnded);

  onEndedRef.current = onEnded;



  useEffect(() => {

    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});

  }, []);



  useEffect(() => {

    if (!uri || !autoPlay) return;

    videoRef.current?.playAsync().catch(() => {});

  }, [uri, autoPlay]);



  function onStatusUpdate(status: AVPlaybackStatus) {

    if (!status.isLoaded) return;

    if (status.didJustFinish && !status.isLooping) {

      onEndedRef.current?.();

    }

  }



  const resizeMode =

    fullscreen && isLandscape ? ResizeMode.COVER : ResizeMode.CONTAIN;



  if (!uri) {

    return (

      <View style={[styles.loading, { width, height: fullscreen ? height : 280 }]}>

        <ActivityIndicator color="#F5E9D3" size="large" />

      </View>

    );

  }



  return (

    <Video

      ref={videoRef}

      source={{ uri }}

      style={[

        styles.video,

        fullscreen

          ? { width, height, minHeight: height }

          : { width, flex: 1, minHeight: 280 },

      ]}

      resizeMode={resizeMode}

      useNativeControls={useNativeControls}

      shouldPlay={autoPlay}

      isLooping={false}

      onPlaybackStatusUpdate={onStatusUpdate}

    />

  );

}



const styles = StyleSheet.create({

  video: {

    backgroundColor: '#000',

  },

  loading: {

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#000',

  },

});


