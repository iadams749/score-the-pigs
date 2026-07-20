import { AlfaSlabOne_400Regular } from '@expo-google-fonts/alfa-slab-one';
import {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { GameProvider } from '@/state/GameProvider';
import { colors, fonts } from '@/theme';

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
          headerBackTitleStyle: { fontFamily: fonts.body },
          contentStyle: { backgroundColor: colors.surface },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="setup" options={{ title: 'New Game' }} />
        <Stack.Screen name="game" options={{ headerShown: false }} />
        <Stack.Screen name="history" options={{ title: 'Roll History' }} />
        <Stack.Screen name="rules" options={{ title: 'How to Play' }} />
        <Stack.Screen name="stats" options={{ title: 'Players' }} />
        <Stack.Screen name="player/[name]" options={{ title: 'Player' }} />
        <Stack.Screen name="recap/[id]" options={{ title: 'Game Recap' }} />
      </Stack>
    </GameProvider>
  );
}
