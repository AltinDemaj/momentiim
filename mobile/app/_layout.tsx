import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { View, ActivityIndicator } from 'react-native';
import { tokens } from '@/theme';
import { ActiveEventProvider } from '@/context/ActiveEventContext';
import { LocaleProvider } from '@/context/LocaleContext';

function extractEventId(url: string): string | null {
  const match = url.match(/event\/([0-9a-f-]{36})/i);
  return match?.[1] ?? null;
}

export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    function handleUrl(url: string) {
      const eventId = extractEventId(url);
      if (eventId) router.push(`/event/${eventId}`);
    }

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [router]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.color.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={tokens.color.accent} />
      </View>
    );
  }

  return (
    <LocaleProvider>
      <ActiveEventProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.color.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="join" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="scan" options={{ animation: 'fade' }} />
          <Stack.Screen name="memories/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="event/[id]" options={{ animation: 'fade' }} />
        </Stack>
      </ActiveEventProvider>
    </LocaleProvider>
  );
}
