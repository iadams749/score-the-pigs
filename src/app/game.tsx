import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Logo } from '@/components/Logo';
import { Button, Felt, RollChip } from '@/components/ui';
import { POSITION_LABELS, SINGLE_VALUES, rollLabel, scoreRoll } from '@/engine/scoring';
import { Roll, SpecialPosition } from '@/engine/types';
import { useGame } from '@/state/GameProvider';
import { colors, fonts, radius, spacing, type } from '@/theme';

const POSITIONS: SpecialPosition[] = [
  'razorback',
  'trotter',
  'snouter',
  'leaningJowler',
];

export default function GameScreen() {
  const router = useRouter();
  const { ready, state, apply, undo, canUndo, finishGame, abandonGame, newGame, game } =
    useGame();
  const [pendingDisaster, setPendingDisaster] = useState<{
    roll: Roll;
    message: string;
  } | null>(null);
  const [abandonVisible, setAbandonVisible] = useState(false);
  const [turnAreaHeight, setTurnAreaHeight] = useState(0);
  const rollStrip = useRef<ScrollView>(null);
  // Finishing a game clears it, which momentarily leaves this screen with no
  // state. Without this flag the guard below would fire and bounce us home,
  // clobbering the recap/rematch navigation we are in the middle of.
  const leaving = useRef(false);

  useEffect(() => {
    if (ready && !state && !leaving.current) router.replace('/');
  }, [ready, state, router]);

  if (!state) return null;

  const current = state.players[state.currentPlayerIndex];
  const winner = state.players.find((p) => p.id === state.winnerId) ?? null;

  // Size the medallion from the space the turn area actually gets, so the
  // screen fits every iPhone (large phones get the full 176, an SE ~90).
  const NAME_BLOCK = 112;
  const medallionSize = turnAreaHeight
    ? Math.max(84, Math.min(176, turnAreaHeight - NAME_BLOCK))
    : 132;
  const scoreSize = Math.round(medallionSize * 0.33);
  const compact = medallionSize < 120;

  const doRoll = (roll: Roll) => apply({ type: 'roll', roll });

  const confirmDisaster = (roll: Roll, message: string) => {
    setPendingDisaster({ roll, message });
  };

  const rematch = async () => {
    const config = game!.config;
    leaving.current = true;
    await finishGame();
    newGame({ ...config, startedAt: Date.now() });
    leaving.current = false;
  };

  const goHome = () => router.dismissTo('/');

  const endAndGoHome = async () => {
    leaving.current = true;
    await finishGame();
    goHome();
  };

  const endAndShowRecap = async () => {
    leaving.current = true;
    const id = await finishGame();
    if (id) {
      router.replace({ pathname: '/recap/[id]', params: { id } });
    } else {
      goHome();
    }
  };

  return (
    <Felt>
      <SafeAreaView style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarCluster}>
            <Pressable onPress={goHome} hitSlop={12}>
              <Text style={styles.topBarLink}>Home</Text>
            </Pressable>
            <Pressable onPress={() => setAbandonVisible(true)} hitSlop={12}>
              <Text style={styles.topBarLinkDanger}>Abandon</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => router.push('/history')} hitSlop={12}>
            <Text style={styles.topBarLink}>History</Text>
          </Pressable>
        </View>

        {/* Scoreboard strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scoreboard}
          contentContainerStyle={styles.scoreboardContent}
        >
          {state.players.map((p) => {
            const isCurrent = p.id === current.id && !winner;
            return (
              <View key={p.id} style={styles.chipShadow}>
                <View
                  style={[
                    styles.playerChip,
                    isCurrent && styles.playerChipCurrent,
                    p.eliminated && styles.playerChipEliminated,
                  ]}
                >
                  <Text
                    style={[styles.playerChipName, isCurrent && { color: colors.accent }]}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                  <Text style={styles.playerChipTotal}>
                    {p.eliminated ? (
                      'OUT'
                    ) : (
                      <>
                        {p.total}
                        <Text style={styles.playerChipTarget}>
                          /{state.config.targetScore}
                        </Text>
                      </>
                    )}
                  </Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(100, (p.total / state.config.targetScore) * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Turn area: the score medallion */}
        <View
          style={styles.turnArea}
          onLayout={(e) => setTurnAreaHeight(e.nativeEvent.layout.height)}
        >
          <Text style={type.eyebrow}>Now rolling</Text>
          <Text style={[styles.currentName, compact && styles.currentNameCompact]}>
            {current.name}
          </Text>
          <View
            style={[
              styles.medallion,
              {
                width: medallionSize,
                height: medallionSize,
                borderRadius: medallionSize / 2,
              },
            ]}
          >
            <View
              style={[
                styles.medallionRing,
                {
                  width: medallionSize - 28,
                  height: medallionSize - 28,
                  borderRadius: (medallionSize - 28) / 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.turnScore,
                  { fontSize: scoreSize, lineHeight: Math.round(scoreSize * 1.3) },
                ]}
                allowFontScaling={false}
              >
                {state.turnScore}
              </Text>
            </View>
          </View>
          {/* One chip per roll this turn. A long turn scrolls rather than
              truncating, and we snap to the end so the roll just tapped is
              always the one in view. */}
          <ScrollView
            ref={rollStrip}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.turnRolls}
            contentContainerStyle={styles.turnRollsContent}
            onContentSizeChange={() =>
              rollStrip.current?.scrollToEnd({ animated: true })
            }
          >
            {state.turnRolls.length > 0 ? (
              state.turnRolls.map((r, i) => (
                <RollChip key={i} label={rollLabel(r)} points={scoreRoll(r)} />
              ))
            ) : (
              <Text style={type.caption}>in hand</Text>
            )}
          </ScrollView>
        </View>

        {/* Roll pad */}
        <View style={styles.pad}>
          {POSITIONS.map((pos) => (
            <View key={pos} style={styles.padRow}>
              <Button
                label={POSITION_LABELS[pos]}
                sublabel={`+${SINGLE_VALUES[pos]}`}
                onPress={() => doRoll({ kind: 'single', position: pos })}
                dense
                style={styles.padButtonWide}
              />
              <Button
                label="×2"
                sublabel={`+${SINGLE_VALUES[pos] * 4}`}
                onPress={() => doRoll({ kind: 'double', position: pos })}
                dense
                style={styles.padButton}
              />
            </View>
          ))}
          <View style={styles.padRow}>
            <Button
              label="Sider"
              sublabel="+1"
              onPress={() => doRoll({ kind: 'sider' })}
              dense
              style={styles.padButton}
            />
            <Button
              label="Undo"
              onPress={undo}
              disabled={!canUndo}
              dense
              style={styles.padButton}
            />
            <Button
              label="Bank"
              sublabel={`+${state.turnScore}`}
              variant="brass"
              onPress={() => apply({ type: 'bank' })}
              dense
              style={styles.padButton}
            />
          </View>
          <View style={styles.padRow}>
            <Button
              label="Pig Out"
              variant="danger"
              onPress={() => doRoll({ kind: 'pigOut' })}
              dense
              style={styles.padButton}
            />
            <Button
              label="Oinker"
              variant="danger"
              onPress={() =>
                confirmDisaster(
                  { kind: 'oinker' },
                  `${current.name}'s whole score goes back to zero.`
                )
              }
              dense
              style={styles.padButton}
            />
            <Button
              label="Piggyback"
              variant="danger"
              onPress={() =>
                confirmDisaster(
                  { kind: 'piggyback' },
                  `${current.name} is eliminated from the game.`
                )
              }
              dense
              style={styles.padButton}
            />
          </View>
        </View>

        <ConfirmDialog
          visible={abandonVisible}
          title="Abandon game?"
          message="The game ends now with no winner. Nothing is saved to history or stats."
          actionLabel="Abandon"
          onConfirm={() => {
            setAbandonVisible(false);
            leaving.current = true;
            abandonGame();
            goHome();
          }}
          onCancel={() => setAbandonVisible(false)}
        />

        <ConfirmDialog
          visible={pendingDisaster !== null}
          title={pendingDisaster ? rollLabel(pendingDisaster.roll) : ''}
          message={pendingDisaster?.message ?? ''}
          actionLabel={pendingDisaster ? rollLabel(pendingDisaster.roll) : ''}
          onConfirm={() => {
            if (pendingDisaster) doRoll(pendingDisaster.roll);
            setPendingDisaster(null);
          }}
          onCancel={() => setPendingDisaster(null)}
        />

        {/* Win overlay */}
        {winner ? (
          <View style={styles.overlay}>
            <Logo size={100} />
            <Text style={type.eyebrow}>Winner</Text>
            <Text style={styles.winnerName}>{winner.name}</Text>
            <View style={styles.standings}>
              {[...state.players]
                .sort(
                  (a, b) =>
                    Number(b.id === winner.id) - Number(a.id === winner.id) ||
                    b.total - a.total
                )
                .map((p) => (
                  <Text key={p.id} style={type.body}>
                    {p.name}: {p.eliminated ? 'eliminated' : p.total}
                  </Text>
                ))}
            </View>
            <View style={styles.overlayActions}>
              <Button label="Game stats" variant="brass" onPress={endAndShowRecap} />
              <Button label="Rematch" variant="accent" onPress={rematch} />
              <Button label="Undo last bank" onPress={undo} />
              <Button label="Done" onPress={endAndGoHome} />
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </Felt>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.m,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.m,
  },
  topBarCluster: {
    flexDirection: 'row',
    gap: spacing.l,
  },
  topBarLink: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  topBarLinkDanger: {
    color: colors.chartBarDanger,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  scoreboard: {
    flexGrow: 0,
  },
  scoreboardContent: {
    gap: spacing.s,
    paddingBottom: spacing.s,
    paddingHorizontal: spacing.xs,
  },
  chipShadow: {
    backgroundColor: colors.cardEdge,
    borderRadius: radius.m,
    paddingBottom: 3,
  },
  playerChip: {
    backgroundColor: colors.card,
    borderRadius: radius.m,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    minWidth: 96,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playerChipCurrent: {
    borderColor: colors.accent,
  },
  playerChipEliminated: {
    opacity: 0.45,
  },
  playerChipName: {
    color: colors.textDim,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  playerChipTotal: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 26,
  },
  // The target rides along with each score as a quiet denominator, so it never
  // competes with the number that actually changes.
  playerChipTarget: {
    color: colors.textDim,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.surfaceDeep,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.brass,
  },
  turnArea: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    gap: spacing.xs,
  },
  currentName: {
    ...type.title,
    fontSize: 26,
  },
  currentNameCompact: {
    fontSize: 20,
  },
  medallion: {
    backgroundColor: colors.card,
    borderWidth: 6,
    borderColor: colors.cardEdge,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  medallionRing: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.stitch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnScore: {
    fontFamily: fonts.display,
    color: colors.text,
  },
  turnRolls: {
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  turnRollsContent: {
    // flexGrow lets a short turn's chips center; once they overflow the strip
    // scrolls instead.
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.l,
    minHeight: 26,
  },
  pad: {
    gap: spacing.s,
  },
  padRow: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  padButton: {
    flex: 1,
  },
  padButtonWide: {
    flex: 2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    padding: spacing.xl,
  },
  winnerName: {
    ...type.title,
    fontSize: 40,
  },
  standings: {
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: spacing.m,
  },
  overlayActions: {
    alignSelf: 'stretch',
    gap: spacing.s,
  },
});
