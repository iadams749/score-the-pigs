import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button, Card, Felt } from '@/components/ui';
import { useGame } from '@/state/GameProvider';
import { loadKnownPlayers, rememberPlayers } from '@/state/stats';
import { colors, fonts, radius, spacing, type } from '@/theme';

/** Ensure unique player names so lifetime stats never merge ("Sam", "Sam 2"). */
function dedupeNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const count = (seen.get(name) ?? 0) + 1;
    seen.set(name, count);
    return count === 1 ? name : `${name} ${count}`;
  });
}

export default function SetupScreen() {
  const router = useRouter();
  const { newGame, game, state } = useGame();
  const [names, setNames] = useState<string[]>([]);
  const [known, setKnown] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [targetText, setTargetText] = useState('100');
  const [replaceVisible, setReplaceVisible] = useState(false);

  const wouldDiscardGame = game !== null && state?.winnerId == null;

  useEffect(() => {
    loadKnownPlayers().then(setKnown);
  }, []);

  const target = parseInt(targetText, 10);
  const targetValid = Number.isFinite(target) && target > 0;

  const addPlayer = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setNames((prev) => [...prev, trimmed]);
  };

  const addDraft = () => {
    addPlayer(draft);
    setDraft('');
  };

  const removePlayer = (index: number) => {
    setNames((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleKnown = (name: string) => {
    setNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const pressStart = () => {
    if (wouldDiscardGame) {
      setReplaceVisible(true);
    } else {
      start();
    }
  };

  const start = () => {
    setReplaceVisible(false);
    const unique = dedupeNames(names);
    rememberPlayers(unique).catch(() => {});
    newGame({
      players: unique.map((name, i) => ({ id: `p${i}`, name })),
      targetScore: target,
      startedAt: Date.now(),
    });
    router.replace('/game');
  };

  const availableKnown = known.filter((n) => !names.includes(n));

  return (
    <Felt>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={type.eyebrow}>Lineup</Text>
          <Card style={styles.playersCard}>
            {names.length === 0 ? (
              <Text style={type.caption}>
                Pick saved players below or add new ones. You need at least two.
              </Text>
            ) : (
              names.map((name, i) => (
                <View key={`${name}-${i}`} style={styles.playerRow}>
                  <Text style={type.body}>
                    {i + 1}. {name}
                  </Text>
                  <Pressable onPress={() => removePlayer(i)} hitSlop={8}>
                    <Text style={styles.remove}>Remove</Text>
                  </Pressable>
                </View>
              ))
            )}
            <View style={styles.addRow}>
              <TextInput
                style={styles.input}
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={addDraft}
                placeholder="New player name"
                placeholderTextColor={colors.textDim}
                returnKeyType="done"
                submitBehavior="submit"
              />
              <Button label="Add" variant="accent" onPress={addDraft} />
            </View>
          </Card>

          {availableKnown.length > 0 ? (
            <>
              <Text style={[type.eyebrow, styles.sectionTitle]}>Saved players</Text>
              <View style={styles.rosterWrap}>
                {availableKnown.map((name) => (
                  <Pressable
                    key={name}
                    onPress={() => toggleKnown(name)}
                    style={({ pressed }) => [
                      styles.rosterChip,
                      pressed && styles.rosterChipPressed,
                    ]}
                  >
                    <Text style={styles.rosterChipText}>+ {name}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          <Text style={[type.eyebrow, styles.sectionTitle]}>Play to</Text>
          <View style={styles.targetRow}>
            <TextInput
              style={[styles.input, styles.targetInput, !targetValid && styles.inputInvalid]}
              value={targetText}
              onChangeText={setTargetText}
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={5}
            />
            <Text style={type.caption}>points wins the game</Text>
          </View>

          <Button
            label="Start game"
            variant="accent"
            disabled={names.length < 2 || !targetValid}
            onPress={pressStart}
            style={styles.start}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={replaceVisible}
        title="Replace current game?"
        message="A game is still in progress. Starting a new one ends it with no winner, and nothing is saved to history or stats."
        actionLabel="Start new game"
        onConfirm={start}
        onCancel={() => setReplaceVisible(false)}
      />
    </Felt>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.l,
    gap: spacing.m,
  },
  playersCard: {
    gap: spacing.m,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remove: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.outline,
    borderWidth: 1,
    borderRadius: radius.m,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  inputInvalid: {
    borderColor: colors.danger,
  },
  sectionTitle: {
    marginTop: spacing.m,
  },
  rosterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  rosterChip: {
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.stitch,
  },
  rosterChipPressed: {
    backgroundColor: colors.cardEdge,
  },
  rosterChipText: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  targetInput: {
    flex: 0,
    minWidth: 96,
    textAlign: 'center',
    fontFamily: fonts.display,
    fontSize: 20,
  },
  start: {
    marginTop: spacing.xl,
  },
});
