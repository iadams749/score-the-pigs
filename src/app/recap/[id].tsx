import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, Felt } from '@/components/ui';
import { DistributionBars, StatGrid, StatTile } from '@/components/statviz';
import { GamePlayerBreakdown, SavedGame, analyzeGame, avgRoll } from '@/engine/stats';
import { loadGame } from '@/state/stats';
import { colors, fonts, spacing, type } from '@/theme';

export default function RecapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [game, setGame] = useState<SavedGame | null | undefined>(undefined);

  useEffect(() => {
    loadGame(id).then(setGame);
  }, [id]);

  if (game === undefined) return <Felt style={styles.fill}>{null}</Felt>;

  if (game === null) {
    return (
      <Felt style={styles.fill}>
        <Text style={[type.caption, styles.missing]}>
          This game is no longer in history.
        </Text>
      </Felt>
    );
  }

  const breakdowns = analyzeGame(game.config, game.actions);
  const ordered = [...breakdowns].sort(
    (a, b) => Number(b.won) - Number(a.won) || b.total - a.total
  );

  return (
    <Felt>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={type.eyebrow}>
          Played to {game.config.targetScore} ·{' '}
          {new Date(game.finishedAt).toLocaleDateString()}
        </Text>
        {ordered.map((b) => (
          <PlayerRecap key={b.playerId} breakdown={b} />
        ))}
      </ScrollView>
    </Felt>
  );
}

function PlayerRecap({ breakdown: b }: { breakdown: GamePlayerBreakdown }) {
  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.playerName}>{b.name}</Text>
        {b.won ? <Text style={styles.winnerTag}>Winner</Text> : null}
        {b.eliminated ? <Text style={styles.outTag}>Eliminated</Text> : null}
      </View>
      <StatGrid>
        <StatTile label="Banked" value={b.total} />
        <StatTile label="Throws" value={b.rolls} />
        <StatTile label="Avg throw" value={avgRoll(b).toFixed(1)} />
        <StatTile label="Best throw" value={b.bestRoll} />
        <StatTile label="Best turn" value={b.bestTurn} />
        <StatTile label="Banks" value={b.banks} />
      </StatGrid>
      <DistributionBars distribution={b.distribution} hideEmpty />
    </Card>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  missing: {
    textAlign: 'center',
    marginTop: spacing.xl * 2,
  },
  content: {
    padding: spacing.l,
    paddingBottom: spacing.xl * 2,
    gap: spacing.m,
  },
  card: {
    gap: spacing.m,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  playerName: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.text,
    flex: 1,
  },
  winnerTag: {
    color: colors.brass,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  outTag: {
    color: colors.chartBarDanger,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
