import { Tabs } from 'expo-router';
import { PremiumTabBar } from '@/components/navigation/PremiumTabBar';
import { tokens, celebration } from '@/theme';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <PremiumTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: celebration.color.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          sceneStyle: { backgroundColor: '#000' },
        }}
      />
      <Tabs.Screen name="memories" options={{ title: 'Memories' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
