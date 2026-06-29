import { useCallback, useState, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  RefreshControl,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { celebration as C } from '@/theme';
import { getDisplayName, setDisplayName } from '@/lib/profile';
import { fetchGuestStats } from '@/lib/events';
import { useLocale } from '@/context/LocaleContext';
import { LOCALE_LABELS, type AppLocale } from '@/lib/i18n';
import {
  SUPPORT_PHONE,
  SUPPORT_PHONE_URI,
  SUPPORT_WHATSAPP_URI,
  SUPPORT_VIBER_URI,
  SUPPORT_INSTAGRAM_URI,
  PRIVACY_POLICY_URL,
} from '@/lib/support';
import { registerForPushNotifications } from '@/lib/pushNotifications';

const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

function Achievement({
  emoji,
  title,
  unlocked,
}: {
  emoji: string;
  title: string;
  unlocked: boolean;
}) {
  return (
    <View style={[styles.achievement, !unlocked && styles.achievementLocked]}>
      <Text style={styles.achievementEmoji}>{emoji}</Text>
      <Text style={[styles.achievementTitle, !unlocked && styles.achievementTitleLocked]}>
        {title}
      </Text>
    </View>
  );
}

function InfoModal({
  visible,
  title,
  body,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  body: string;
  onClose: () => void;
  children?: ReactNode;
}) {
  const { t } = useLocale();
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalBody}>{body}</Text>
          {children}
          <Pressable style={styles.modalCloseBtn} onPress={onClose}>
            <Text style={styles.modalCloseText}>{t('profile.close')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function ProfileScreen() {
  const { t, locale, setLocale } = useLocale();
  const [name, setName] = useState(t('common.guest'));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [infoModal, setInfoModal] = useState<'notifications' | 'privacy' | 'help' | null>(null);
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);
  const [stats, setStats] = useState({
    eventsJoined: 0,
    photosCaptured: 0,
    memoriesCount: 0,
    videosCaptured: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const displayName = await getDisplayName();
    setName(displayName);
    setDraft(displayName);
    const s = await fetchGuestStats();
    setStats(s);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function saveName() {
    await setDisplayName(draft.trim() || t('common.guest'));
    setName(draft.trim() || t('common.guest'));
    setEditing(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function enableNotifications() {
    setEnablingPush(true);
    const result = await registerForPushNotifications();
    setEnablingPush(false);
    if (result.success) {
      setNotificationsOn(true);
      return;
    }
    const pushKey =
      result.error === 'REQUIRES_DEVICE'
        ? 'push.requiresDevice'
        : result.error === 'PERMISSION_DENIED'
          ? 'push.permissionDenied'
          : result.error === 'NOT_SIGNED_IN'
            ? 'push.notSignedIn'
            : 'push.registerFailed';
    Alert.alert(t('profile.notificationsTitle'), t(pushKey));
  }

  function openSocial(uri: string) {
    Linking.openURL(uri).catch(() => {});
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.color.accent} />
        }
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>

        {editing ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.nameInput}
              value={draft}
              onChangeText={setDraft}
              autoFocus
              placeholder={t('profile.yourName')}
              placeholderTextColor={C.color.muted}
            />
            <Pressable onPress={saveName}>
              <Text style={styles.saveBtn}>{t('profile.save')}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setEditing(true)}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.editHint}>{t('profile.editHint')}</Text>
          </Pressable>
        )}

        <View style={styles.journeyCard}>
          <Text style={styles.sectionLabel}>{t('profile.journey')}</Text>
          <View style={styles.journeyStats}>
            <View style={styles.journeyStat}>
              <Text style={styles.journeyValue}>{stats.eventsJoined}</Text>
              <Text style={styles.journeyLabel}>{t('profile.events')}</Text>
            </View>
            <View style={styles.journeyDivider} />
            <View style={styles.journeyStat}>
              <Text style={styles.journeyValue}>{stats.photosCaptured}</Text>
              <Text style={styles.journeyLabel}>{t('profile.moments')}</Text>
            </View>
            <View style={styles.journeyDivider} />
            <View style={styles.journeyStat}>
              <Text style={styles.journeyValue}>{stats.memoriesCount}</Text>
              <Text style={styles.journeyLabel}>{t('profile.memoriesDeveloped')}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t('profile.achievements')}</Text>
        <View style={styles.achievements}>
          <Achievement emoji="💍" title={t('profile.achievement.firstWedding')} unlocked={stats.eventsJoined >= 1} />
          <Achievement emoji="📸" title={t('profile.achievement.hundredMoments')} unlocked={stats.photosCaptured >= 100} />
          <Achievement emoji="🌙" title={t('profile.achievement.nightPhotographer')} unlocked={stats.photosCaptured >= 10} />
          <Achievement emoji="🎬" title={t('profile.achievement.reelMaker')} unlocked={stats.videosCaptured >= 1} />
        </View>

        <Text style={styles.sectionLabel}>{t('profile.preferences')}</Text>
        <View style={styles.menu}>
          <View style={styles.languageBlock}>
            <View style={styles.languageHeader}>
              <Ionicons name="language-outline" size={20} color={C.color.textSecondary} />
              <Text style={styles.menuLabel}>{t('profile.language')}</Text>
            </View>
            <View style={styles.languageRow}>
              {(['sq', 'en', 'de'] as AppLocale[]).map((code) => (
                <Pressable
                  key={code}
                  style={[styles.langChip, locale === code && styles.langChipOn]}
                  onPress={() => setLocale(code)}
                >
                  <Text style={[styles.langChipText, locale === code && styles.langChipTextOn]}>
                    {LOCALE_LABELS[code]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          {[
            { icon: 'notifications-outline' as const, label: t('profile.notifications'), key: 'notifications' as const },
            { icon: 'shield-outline' as const, label: t('profile.privacy'), key: 'privacy' as const },
            { icon: 'help-circle-outline' as const, label: t('profile.support'), key: 'help' as const },
          ].map((item) => (
            <Pressable key={item.key} style={styles.menuRow} onPress={() => setInfoModal(item.key)}>
              <Ionicons name={item.icon} size={20} color={C.color.textSecondary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={C.color.muted} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.version}>Momenti Im · {t('profile.guest')}</Text>
      </ScrollView>

      <InfoModal
        visible={infoModal === 'notifications'}
        title={t('profile.notificationsTitle')}
        body={t('profile.notificationsBody')}
        onClose={() => setInfoModal(null)}
      >
        {notificationsOn ? (
          <Text style={styles.notifOn}>{t('profile.notificationsOn')}</Text>
        ) : (
          <Pressable style={styles.enableBtn} onPress={enableNotifications} disabled={enablingPush}>
            <Text style={styles.enableBtnText}>
              {enablingPush ? '…' : t('profile.enableNotifications')}
            </Text>
          </Pressable>
        )}
      </InfoModal>
      <InfoModal
        visible={infoModal === 'privacy'}
        title={t('profile.privacyTitle')}
        body={t('profile.privacyBody')}
        onClose={() => setInfoModal(null)}
      >
        <Pressable style={styles.phoneBtn} onPress={() => openSocial(PRIVACY_POLICY_URL)}>
          <Ionicons name="document-text-outline" size={18} color={C.color.accent} />
          <Text style={styles.phoneLabel}>{t('profile.viewPrivacyPolicy')}</Text>
        </Pressable>
      </InfoModal>
      <InfoModal
        visible={infoModal === 'help'}
        title={t('profile.helpTitle')}
        body={t('profile.helpBody')}
        onClose={() => setInfoModal(null)}
      >
        <Pressable
          style={styles.phoneBtn}
          onPress={() => openSocial(SUPPORT_PHONE_URI)}
        >
          <Ionicons name="call-outline" size={18} color={C.color.accent} />
          <View style={styles.phoneMeta}>
            <Text style={styles.phoneLabel}>{t('profile.callSupport')}</Text>
            <Text style={styles.phoneNumber}>{SUPPORT_PHONE}</Text>
          </View>
        </Pressable>
        <View style={styles.socialRow}>
          <Pressable style={styles.socialChip} onPress={() => openSocial(SUPPORT_WHATSAPP_URI)}>
            <Text style={styles.socialChipText}>{t('profile.whatsapp')}</Text>
          </Pressable>
          <Pressable style={styles.socialChip} onPress={() => openSocial(SUPPORT_VIBER_URI)}>
            <Text style={styles.socialChipText}>{t('profile.viber')}</Text>
          </Pressable>
          <Pressable style={styles.socialChip} onPress={() => openSocial(SUPPORT_INSTAGRAM_URI)}>
            <Text style={styles.socialChipText}>{t('profile.instagram')}</Text>
          </Pressable>
        </View>
      </InfoModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.color.bg },
  scroll: {
    paddingHorizontal: C.spacing.lg,
    paddingBottom: 120,
    alignItems: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.color.accentDim,
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  avatarText: {
    color: C.color.accent,
    fontSize: 36,
    fontFamily: font.bold,
  },
  name: {
    color: C.color.text,
    fontSize: 24,
    fontFamily: font.bold,
    textAlign: 'center',
    marginTop: 16,
  },
  editHint: {
    color: C.color.muted,
    fontSize: 12,
    fontFamily: font.regular,
    textAlign: 'center',
    marginTop: 4,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.color.borderStrong,
    borderRadius: C.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.color.text,
    fontFamily: font.medium,
    backgroundColor: C.color.glass,
  },
  saveBtn: {
    color: C.color.accent,
    fontFamily: font.semibold,
    fontSize: 16,
  },
  journeyCard: {
    width: '100%',
    marginTop: C.spacing.lg,
    padding: C.spacing.lg,
    borderRadius: C.radius.lg,
    backgroundColor: C.color.glass,
    borderWidth: 1,
    borderColor: C.color.borderStrong,
    gap: 14,
  },
  sectionLabel: {
    alignSelf: 'flex-start',
    color: C.color.muted,
    fontSize: 11,
    fontFamily: font.semibold,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginTop: C.spacing.lg,
    marginBottom: 12,
    width: '100%',
  },
  journeyStats: { flexDirection: 'row', alignItems: 'center' },
  journeyStat: { flex: 1, alignItems: 'center', gap: 4 },
  journeyValue: {
    color: C.color.text,
    fontSize: 24,
    fontFamily: font.bold,
  },
  journeyLabel: {
    color: C.color.muted,
    fontSize: 11,
    fontFamily: font.regular,
    textAlign: 'center',
  },
  journeyDivider: {
    width: 1,
    height: 40,
    backgroundColor: C.color.border,
  },
  achievements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
  },
  achievement: {
    width: '47%',
    padding: 14,
    borderRadius: C.radius.md,
    backgroundColor: C.color.glass,
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.25)',
    alignItems: 'center',
    gap: 6,
  },
  achievementLocked: {
    opacity: 0.45,
    borderColor: C.color.border,
  },
  achievementEmoji: { fontSize: 28 },
  achievementTitle: {
    color: C.color.textSecondary,
    fontSize: 13,
    fontFamily: font.semibold,
    textAlign: 'center',
  },
  achievementTitleLocked: { color: C.color.muted },
  menu: { width: '100%', gap: 4 },
  languageBlock: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 10,
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageRow: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 32,
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.color.border,
    backgroundColor: C.color.glass,
  },
  langChipOn: {
    borderColor: C.color.accent,
    backgroundColor: C.color.accentDim,
  },
  langChipText: {
    color: C.color.textSecondary,
    fontSize: 13,
    fontFamily: font.medium,
  },
  langChipTextOn: {
    color: C.color.accent,
    fontFamily: font.semibold,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  menuLabel: {
    flex: 1,
    color: C.color.textSecondary,
    fontSize: 16,
    fontFamily: font.medium,
  },
  version: {
    color: C.color.muted,
    fontSize: 12,
    fontFamily: font.regular,
    marginTop: C.spacing.xl,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: C.color.bgSecondary,
    borderRadius: C.radius.lg,
    padding: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: C.color.border,
  },
  modalTitle: {
    color: C.color.text,
    fontSize: 20,
    fontFamily: font.bold,
  },
  modalBody: {
    color: C.color.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: font.regular,
  },
  modalCloseBtn: {
    marginTop: 8,
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  modalCloseText: {
    color: C.color.accent,
    fontFamily: font.semibold,
    fontSize: 16,
  },
  phoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: C.radius.md,
    backgroundColor: C.color.glass,
    borderWidth: 1,
    borderColor: C.color.borderStrong,
  },
  phoneMeta: { flex: 1, gap: 2 },
  phoneLabel: {
    color: C.color.muted,
    fontSize: 12,
    fontFamily: font.medium,
  },
  phoneNumber: {
    color: C.color.accent,
    fontSize: 18,
    fontFamily: font.semibold,
  },
  notifOn: {
    color: C.color.success,
    fontFamily: font.medium,
    fontSize: 14,
    textAlign: 'center',
  },
  enableBtn: {
    backgroundColor: C.color.accent,
    borderRadius: C.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  enableBtnText: {
    color: C.color.bg,
    fontFamily: font.semibold,
    fontSize: 15,
  },
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  socialChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.color.borderStrong,
    backgroundColor: C.color.glass,
  },
  socialChipText: {
    color: C.color.textSecondary,
    fontFamily: font.medium,
    fontSize: 13,
  },
});
