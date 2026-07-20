import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Card, Felt, RollChip } from '@/components/ui';
import { TURN_OUTCOME_LABELS, rollLabel } from '@/engine/scoring';
import { Turn } from '@/engine/types';
import { useGame } from '@/state/GameProvider';
import { colors, fonts, spacing, type } from '@/theme';

/** The three disasters read in the danger colour; a bank reads in brass. */
const DISASTERS: Turn['outcome'][] = ['pigOut', 'oinker', 'piggyback'];

function outcomeText(turn: Turn): string {
  const label = TURN_OUTCOME_LABELS[turn.outcome];
  return turn.outcome === 'banked' ? `${label} ${turn.scored}` : label;
}

function TurnCard({ turn }: { turn: Turn }) {
  const isDisaster = DISASTERS.includes(turn.outcome);

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.player} numberOfLines={1}>
          {turn.playerName}
        </Text>
        <Text
          style={[
            styles.outcome,
            isDisaster && styles.outcomeDisaster,
            turn.outcome === 'inProgress' && styles.outcomeInProgress,
          ]}
        >
          {outcomeText(turn)}
        </Text>
      </View>

      {turn.rolls.length > 0 ? (
        <View style={styles.rolls}>
          {turn.rolls.map((r, i) => (
            <RollChip key={i} label={rollLabel(r.roll)} points={r.points} />
          ))}
        </View>
      ) : null}

      <Text style={styles.total}>total → {turn.totalAfter}</Text>
    </Card>
  );
}

export default function HistoryScreen() {
  const { turns } = useGame();
  const newestFirst = [...turns].reverse();

  return (
    <Felt>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={newestFirst}
        keyExtractor={(_, i) => String(newestFirst.length - i)}
        ListEmptyComponent={
          <Text style={[type.caption, styles.empty]}>No rolls yet.</Text>
        }
        renderItem={({ item }) => <TurnCard turn={item} />}
      />
    </Felt>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    padding: spacing.l,
    gap: spacing.s,
  },
  empty: {
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.m,
  },
  player: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    flexShrink: 1,
  },
  outcome: {
    color: colors.brass,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  outcomeDisaster: {
    color: colors.chartBarDanger,
  },
  outcomeInProgress: {
    color: colors.textDim,
  },
  rolls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.s,
  },
  total: {
    ...type.caption,
    marginTop: spacing.s,
    textAlign: 'right',
  },
});
