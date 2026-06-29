import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens, celebration } from '@/theme';
import { useLocale } from '@/context/LocaleContext';
import type { TranslationKey } from '@/lib/i18n';

const font = { medium: 'Inter_500Medium', semibold: 'Inter_600SemiBold' };

const TABS: {
  name: string;
  labelKey: TranslationKey;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}[] = [
  { name: 'index', labelKey: 'tabs.home', icon: 'home-outline', iconActive: 'home' },
  { name: 'camera', labelKey: 'tabs.camera', icon: 'camera-outline', iconActive: 'camera' },
  { name: 'memories', labelKey: 'tabs.keepsakes', icon: 'images-outline', iconActive: 'images' },
  { name: 'profile', labelKey: 'tabs.profile', icon: 'person-outline', iconActive: 'person' },
];

export function PremiumTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const isCamera = state.routes[state.index]?.name === 'camera';
  const theme = isCamera ? tokens : celebration;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: isCamera ? 'rgba(18,18,20,0.92)' : 'rgba(255,255,255,0.92)',
            borderColor: theme.color.borderStrong,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const tab = TABS.find((item) => item.name === route.name) ?? TABS[0];
          const focused = state.index === index;

          return (
            <Pressable
              key={route.key}
              style={styles.tab}
              onPress={() => navigation.navigate(route.name)}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
            >
              <Ionicons
                name={focused ? tab.iconActive : tab.icon}
                size={22}
                color={focused ? theme.color.accent : theme.color.muted}
              />
              <Text
                style={[
                  styles.label,
                  focused && styles.labelActive,
                  { color: focused ? theme.color.accent : theme.color.muted },
                ]}
              >
                {t(tab.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    fontFamily: font.medium,
    letterSpacing: 0.2,
  },
  labelActive: {
    fontFamily: font.semibold,
  },
});
