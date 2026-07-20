import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Logo } from '@/components/Logo';
import { Button, Card, Felt } from '@/components/ui';
import { useGame } from '@/state/GameProvider';
import { colors, spacing, type } from '@/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { ready, game, state, abandonGame } = useGame();
  const [abandonVisible, setAbandonVisible] = useState(false);

  const inProgress = ready && game !== null && state?.winnerId == null;

  return (
    <Felt>
      <SafeAreaView style={styles.container}>
        <View style={styles.hero}>
          <Logo size={150} />
          <Text style={styles.title}>Score{'\n'}the Pigs</Text>
          <Text style={[type.eyebrow, styles.tagline]}>
            Pass the pigs · minus the math
          </Text>
        </View>

        <View style={styles.actions}>
          {inProgress && state ? (
            <Card style={styles.resumeCard}>
              <Text style={type.eyebrow}>Game in progress</Text>
              <Text style={type.caption}>
                {state.players.map((p) => `${p.name} ${p.total}`).join('  ·  ')}
              </Text>
              <Button
                label="Resume game"
                variant="accent"
                onPress={() => router.push('/game')}
              />
              <Button
                label="Abandon game"
                variant="danger"
                onPress={() => setAbandonVisible(true)}
              />
            </Card>
          ) : null}
          <Button
            label="New game"
            variant={inProgress ? 'card' : 'accent'}
            onPress={() => router.push('/setup')}
          />
          <Button label="Players" onPress={() => router.push('/stats')} />
          <Button label="How to play" onPress={() => router.push('/rules')} />
        </View>
      </SafeAreaView>

      <ConfirmDialog
        visible={abandonVisible}
        title="Abandon game?"
        message="The game ends now with no winner. Nothing is saved to history or stats."
        actionLabel="Abandon"
        onConfirm={() => {
          setAbandonVisible(false);
          abandonGame();
        }}
        onCancel={() => setAbandonVisible(false)}
      />
    </Felt>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.m,
  },
  title: {
    ...type.title,
    fontSize: 44,
    lineHeight: 52,
    textAlign: 'center',
  },
  tagline: {
    color: colors.textDim,
  },
  actions: {
    gap: spacing.m,
  },
  resumeCard: {
    gap: spacing.m,
  },
});
