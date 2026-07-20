import { AlfaSlabOne_400Regular } from '@expo-google-fonts/alfa-slab-one';
import {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { GameProvider } from '@/state/GameProvider';
import { colors, fonts, spacing } from '@/theme';

/**
 * The back chevron, drawn rather than borrowed. Each platform's stock back
 * button looks like its own OS — iOS renders an SF Symbol, web a plain
 * glyph — so we replace it with one vector that is identical everywhere.
 */
function BackChevron() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={spacing.m}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
    >
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Path
          d="M15 4.5 L7.5 12 L15 19.5"
          stroke={colors.text}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: { paddingRight: spacing.s },
  backPressed: { opacity: 0.6 },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    AlfaSlabOne_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <GameProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          // The phone gets passed around mid-game; a stray swipe must never
          // change screens. Every route is left via an explicit button.
          gestureEnabled: false,
          headerStyle: { backgroundColor: colors.surfaceDeep },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: fonts.display, fontSize: 17 },
          // Our own chevron, on every platform. Hiding the native button also
          // drops the back title iOS would otherwise draw from the previous
          // screen's name.
          headerBackVisible: false,
          headerLeft: ({ canGoBack }) => (canGoBack ? <BackChevron /> : null),
          // iOS 26 seats every header button in a shared "glass" capsule, so
          // the bare chevron above picks up a circle. Only the bar-button-item
          // path can opt out of it, and iOS reads that list in place of
          // `headerLeft`; every other platform ignores it and uses the above.
          unstable_headerLeftItems: ({ canGoBack }) =>
            canGoBack
              ? [
                  {
                    type: 'custom',
                    element: <BackChevron />,
                    hidesSharedBackground: true,
                  },
                ]
              : [],
          contentStyle: { backgroundColor: colors.surface },
        }}
      >
        {/* Header-less screens still carry a `title` so nothing derived from
            the route name (document title on web, task switcher) falls back to
            the filename ("index", "game"). */}
        <Stack.Screen name="index" options={{ headerShown: false, title: 'Home' }} />
        <Stack.Screen name="setup" options={{ title: 'New Game' }} />
        <Stack.Screen name="game" options={{ headerShown: false, title: 'Game' }} />
        <Stack.Screen name="history" options={{ title: 'Roll History' }} />
        <Stack.Screen name="rules" options={{ title: 'How to Play' }} />
        <Stack.Screen name="stats" options={{ title: 'Players' }} />
        <Stack.Screen name="player/[name]" options={{ title: 'Player' }} />
        <Stack.Screen name="recap/[id]" options={{ title: 'Game Recap' }} />
      </Stack>
    </GameProvider>
  );
}
