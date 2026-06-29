import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { PrimaryButton, SecondaryButton } from '@/components/ui';
import { resolveJoinCode } from '@/lib/join';
import { useActiveEvent } from '@/context/ActiveEventContext';
import { useLocale } from '@/context/LocaleContext';

const font = {
  regular: 'Inter_400Regular',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export default function JoinScreen() {
  const router = useRouter();
  const { joinEvent } = useActiveEvent();
  const { t } = useLocale();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  function handleCodeChange(text: string) {
    setCode(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
    setError(null);
  }

  async function handleJoin() {
    if (code.length !== 6) {
      setError(t('join.codeError'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await resolveJoinCode(code);
      await joinEvent(result.event_id);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('event.joinFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.close} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={tokens.color.text} />
        </Pressable>

        <View style={styles.content}>
          <Text style={styles.title}>{t('join.title')}</Text>
          <Text style={styles.subtitle}>{t('join.subtitle')}</Text>

          <Pressable style={styles.codeRow} onPress={() => inputRef.current?.focus()}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={[styles.codeBox, code.length === i && styles.codeBoxActive]}>
                <Text style={styles.codeChar}>{code[i] ?? ''}</Text>
              </View>
            ))}
          </Pressable>

          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={handleCodeChange}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            style={styles.hiddenInput}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <PrimaryButton label={t('join.button')} onPress={handleJoin} loading={loading} disabled={code.length !== 6} />
            <SecondaryButton label={t('join.scanButton')} onPress={() => router.push('/scan')} />
          </View>

          <Text style={styles.note}>{t('join.note')}</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: tokens.color.bg,
  },
  flex: {
    flex: 1,
  },
  close: {
    alignSelf: 'flex-start',
    margin: 16,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: tokens.spacing.lg,
    justifyContent: 'center',
    paddingBottom: 48,
  },
  title: {
    color: tokens.color.text,
    fontSize: 28,
    fontFamily: font.bold,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: tokens.color.muted,
    fontSize: 15,
    fontFamily: font.regular,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 28,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  codeBox: {
    width: 46,
    height: 54,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.bgSecondary,
    borderWidth: 1,
    borderColor: tokens.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxActive: {
    borderColor: 'rgba(245,233,211,0.55)',
    backgroundColor: tokens.color.accentDim,
  },
  codeChar: {
    color: tokens.color.text,
    fontSize: 22,
    fontFamily: font.bold,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  error: {
    color: tokens.color.danger,
    textAlign: 'center',
    marginTop: 12,
    fontFamily: font.regular,
  },
  actions: {
    gap: 12,
    marginTop: 28,
  },
  note: {
    color: tokens.color.muted,
    fontSize: 12,
    fontFamily: font.regular,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});
