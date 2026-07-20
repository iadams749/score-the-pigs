import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PromptDialog } from '@/components/PromptDialog';
import { DistributionBars, StatGrid, StatTile } from '@/components/statviz';
import { Button, Card, Felt } from '@/components/ui';
import {
  LifetimeAnalysis,
  SavedGame,
  analyzeLifetime,
  avgRoll,
  summarizeByName,
} from '@/engine/stats';
import { useGame } from '@/state/GameProvider';
import {
  loadGames,
  loadKnownPlayers,
  removePlayer,
  renamePlayer,
} from '@/state/stats';
import { colors, fonts, spacing, type } from '@/theme';

export default function PlayerDetailScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();
  const { renameInCurrentGame } = useGame();
  const [lifetime, setLifetime] = useState<LifetimeAnalysis | null>(null);
  const [playerGames, setPlayerGames] = useState<SavedGame[]>([]);
  const [otherNames, setOtherNames] = useState<Set<string>>(new Set());
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadGames(), loadKnownPlayers()]).then(([games, known]) => {
      setLifetime(analyzeLifetime(games, name));
      setPlayerGames(
        games
          .filter((g) => g.config.players.some((p) => p.name === name))
          .sort((a, b) => b.finishedAt - a.finishedAt)
      );
      const names = new Set([...known, ...Object.keys(summarizeByName(games))]);
      names.delete(name);
      setOtherNames(names);
    });
  }, [name]);

  const doRemove = () => {
    setConfirmVisible(false);
    removePlayer(name).then(() => router.back());
  };

  const submitRename = (value: string) => {
    if (value === name) {
      setRenameVisible(false);
      setRenameError(null);
      return;
    }
    if (otherNames.has(value)) {
      setRenameError('Another player already has this name.');
      return;
    }
    setRenameError(null);
    setRenameVisible(false);
    renamePlayer(name, value).then(() => {
      renameInCurrentGame(name, value);
      router.replace({ pathname: '/player/[name]', params: { name: value } });
    });
  };

  return (
    <Felt>
      <Stack.Screen options={{ title: name }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.name}>{name}</Text>

        {lifetime === null ? null : lifetime.games === 0 ? (
          <Card>
            <Text style={type.caption}>
              No finished games yet. Stats appear once {name} plays a game to
              the end.
            </Text>
          </Card>
        ) : (
          <>
            <Text style={type.eyebrow}>Record</Text>
            <Card style={styles.card}>
              <StatGrid>
                <StatTile label="Games" value={lifetime.games} />
                <StatTile label="Wins" value={lifetime.wins} />
                <StatTile
                  label="Win rate"
                  value={`${Math.round((lifetime.wins / lifetime.games) * 100)}%`}
                />
              </StatGrid>
            </Card>

            <Text style={[type.eyebrow, styles.sectionTitle]}>Throwing</Text>
            <Card style={styles.card}>
              <StatGrid>
                <StatTile label="Throws" value={lifetime.rolls} />
                <StatTile label="Avg throw" value={avgRoll(lifetime).toFixed(1)} />
                <StatTile label="Points thrown" value={lifetime.pointsRolled} />
                <StatTile label="Best throw" value={lifetime.bestRoll} />
                <StatTile label="Best turn" value={lifetime.bestTurn} />
                <StatTile
                  label="Avg banked"
                  value={(lifetime.totalBanked / lifetime.games).toFixed(0)}
                />
              </StatGrid>
            </Card>

            <Text style={[type.eyebrow, styles.sectionTitle]}>
              Throw distribution
            </Text>
            <Card style={styles.card}>
              <DistributionBars distribution={lifetime.distribution} />
            </Card>

            <Text style={[type.eyebrow, styles.sectionTitle]}>Games</Text>
            <View style={styles.gamesList}>
              {playerGames.map((g) => {
                const won =
                  g.config.players.find((p) => p.id === g.winnerId)?.name === name;
                return (
                  <Pressable
                    key={g.id}
                    onPress={() =>
                      router.push({ pathname: '/recap/[id]', params: { id: g.id } })
                    }
                    style={({ pressed }) => [
                      styles.gameRow,
                      pressed && styles.gameRowPressed,
                    ]}
                  >
                    <Text style={[styles.gameResult, won && styles.gameResultWin]}>
                      {won ? 'W' : 'L'}
                    </Text>
                    <View style={styles.gameRowText}>
                      <Text style={type.body}>
                        {g.config.players.map((p) => p.name).join(' · ')}
                      </Text>
                      <Text style={type.caption}>
                        {new Date(g.finishedAt).toLocaleDateString()} · to{' '}
                        {g.config.targetScore}
                      </Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <Button
          label="Rename player"
          onPress={() => {
            setRenameError(null);
            setRenameVisible(true);
          }}
          style={styles.remove}
        />
        <Button
          label="Remove player"
          variant="danger"
          onPress={() => setConfirmVisible(true)}
        />
      </ScrollView>

      <PromptDialog
        visible={renameVisible}
        title={`Rename ${name}`}
        initialValue={name}
        actionLabel="Rename"
        error={renameError}
        onSubmit={submitRename}
        onCancel={() => setRenameVisible(false)}
      />

      <ConfirmDialog
        visible={confirmVisible}
        title={`Remove ${name}?`}
        message="They disappear from the saved player list. Their finished games stay in history, and adding them to a lineup again brings them back."
        actionLabel="Remove"
        onConfirm={doRemove}
        onCancel={() => setConfirmVisible(false)}
      />
    </Felt>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.l,
    paddingBottom: spacing.xl * 2,
    gap: spacing.m,
  },
  name: {
    ...type.title,
    marginBottom: spacing.s,
  },
  card: {
    gap: spacing.s,
  },
  sectionTitle: {
    marginTop: spacing.s,
  },
  gamesList: {
    gap: spacing.s,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.m,
    gap: spacing.m,
  },
  gameRowPressed: {
    backgroundColor: colors.cardEdge,
  },
  gameResult: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.textDim,
    width: 24,
    textAlign: 'center',
  },
  gameResultWin: {
    color: colors.brass,
  },
  gameRowText: {
    flex: 1,
    gap: 2,
  },
  chevron: {
    color: colors.textDim,
    fontFamily: fonts.bodyBold,
    fontSize: 22,
  },
  remove: {
    marginTop: spacing.xl,
  },
});
