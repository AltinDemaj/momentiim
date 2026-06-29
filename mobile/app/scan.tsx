import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '@/theme';
import { ViewfinderOverlay } from '@/components/ViewfinderOverlay';
import { SecondaryButton } from '@/components/ui';
import { extractEventIdFromUrl, resolveJoinCode } from '@/lib/join';
import { useActiveEvent } from '@/context/ActiveEventContext';
import { useLocale } from '@/context/LocaleContext';

const font = {
  regular: 'Inter_400Regular',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export default function ScanScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { joinEvent } = useActiveEvent();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  async function handleScan(data: string) {
    if (scanned) return;
    setScanned(true);

    try {
      let eventId = extractEventIdFromUrl(data);

      if (!eventId) {
        const codeMatch = data.match(/\/join\/([A-Z0-9]{6})(?:\/|$|\?)/i);
        if (codeMatch) {
          const result = await resolveJoinCode(codeMatch[1]);
          eventId = result.event_id;
        } else if (/^[A-Z0-9]{6}$/i.test(data.trim())) {
          const result = await resolveJoinCode(data.trim());
          eventId = result.event_id;
        }
      }

      if (eventId) {
        await joinEvent(eventId);
        router.replace('/(tabs)/camera');
        return;
      }

      setScanned(false);
    } catch {
      setScanned(false);
    }
  }

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="qr-code-outline" size={48} color={tokens.color.accent} />
        <Text style={styles.title}>{t('scan.title')}</Text>
        <Text style={styles.hint}>{t('scan.hint')}</Text>
        <SecondaryButton label={t('scan.enable')} onPress={requestPermission} />
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>{t('scan.back')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => handleScan(data)}
      />
      <View style={styles.dim} />
      <SafeAreaView style={styles.overlay}>
        <Pressable style={styles.close} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>

        <View style={styles.frameWrap}>
          <View style={styles.frame}>
            <ViewfinderOverlay />
          </View>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.scanHint}>{t('scan.align')}</Text>
          <Text style={styles.scanSub}>{t('scan.sources')}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,11,12,0.35)',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: tokens.spacing.lg,
  },
  center: {
    flex: 1,
    backgroundColor: tokens.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing.xl,
    gap: 16,
  },
  title: {
    color: tokens.color.text,
    fontSize: 22,
    fontFamily: font.bold,
  },
  hint: {
    color: tokens.color.textSecondary,
    fontFamily: font.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
  link: {
    color: tokens.color.muted,
    fontFamily: font.regular,
    marginTop: 16,
  },
  close: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(11,11,12,0.65)',
    borderWidth: 1,
    borderColor: tokens.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 280,
    height: 280,
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  bottom: {
    alignItems: 'center',
    gap: 6,
  },
  scanHint: {
    color: '#fff',
    fontFamily: font.semibold,
    textAlign: 'center',
    fontSize: 17,
  },
  scanSub: {
    color: 'rgba(255,255,255,0.65)',
    fontFamily: font.regular,
    fontSize: 13,
    textAlign: 'center',
  },
});
