import { Modal, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { celebration as C } from '@/theme';

interface BusyOverlayProps {
  visible: boolean;
  message: string;
  submessage?: string;
}

export function BusyOverlay({ visible, message, submessage }: BusyOverlayProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={C.color.accent} />
          <Text style={styles.message}>{message}</Text>
          {submessage ? <Text style={styles.submessage}>{submessage}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,22,18,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#1A1612',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  message: {
    color: C.color.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  submessage: {
    color: C.color.muted,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
});
