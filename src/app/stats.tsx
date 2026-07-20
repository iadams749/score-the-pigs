import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Felt } from '@/components/ui';
import { summarizeByName } from '@/engine/stats';
import { loadGames, loadKnownPlayers } from '@/state/stats';
import { colors, fonts, spacing, type } from '@/theme';

interface PlayerRow {
  name: string;
  stats: { games: number; wins: number } | null;
}

export default function PlayersScreen() {
  const router = useRouter();
  const [players, setPlayers] = useState<PlayerRow[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([loadKnownPlayers(), loadGames()]).then(([names, games]) => {
        if (!active) return;
        const summary = summarizeByName(games);
        setPlayers(names.map((name) => ({ name, stats: summary[name] ?? null })));
      });
      return () => {
        active = false;
      };
    }, [])
  );

  if (!players) return <Felt style={styles.container}>{null}</Felt>;

  return (
    <Felt>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {players.length === 0 ? (
          <Text style={[type.caption, styles.empty]}>
            No players yet. They appear here once you set up a game.
          </Text>
        ) : (
          players.map((p) => (
            <Pressable
              key={p.name}
              onPress={() =>
                router.push({ pathname: '/player/[name]', params: { name: p.name } })
              }
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View style={styles.rowText}>
                <Text style={type.heading}>{p.name}</Text>
                <Text style={type.caption}>
                  {p.stats
                    ? `${p.stats.games} game${p.stats.games === 1 ? '' : 's'} · ${p.stats.wins} win${p.stats.wins === 1 ? '' : 's'}`
                    : 'No finished games yet'}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Felt>
  );
}

const styles = StyleSheet.create({
  container: {
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.l,
    gap: spacing.m,
  },
  rowPressed: {
    backgroundColor: colors.cardEdge,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  chevron: {
    color: colors.textDim,
    fontFamily: fonts.bodyBold,
    fontSize: 24,
  },
});
