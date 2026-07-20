import AsyncStorage from '@react-native-async-storage/async-storage';

import { SavedGame, summarizeByName } from '@/engine/stats';
import { GameAction, GameConfig } from '@/engine/types';

const GAMES_KEY = 'ptp/games';
const ROSTER_KEY = 'ptp/roster';

export async function loadGames(): Promise<SavedGame[]> {
  const raw = await AsyncStorage.getItem(GAMES_KEY);
  return raw ? (JSON.parse(raw) as SavedGame[]) : [];
}

export async function loadGame(id: string): Promise<SavedGame | null> {
  const games = await loadGames();
  return games.find((g) => g.id === id) ?? null;
}

export async function saveFinishedGame(
  config: GameConfig,
  actions: GameAction[],
  winnerId: string
): Promise<SavedGame> {
  const games = await loadGames();
  const saved: SavedGame = {
    id: `g${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    config,
    actions,
    winnerId,
    finishedAt: Date.now(),
  };
  await AsyncStorage.setItem(GAMES_KEY, JSON.stringify([...games, saved]));
  return saved;
}

async function loadRoster(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(ROSTER_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

/**
 * Names offered on the setup screen, most-played first. Roster only: every
 * game start records its lineup, and removing a player keeps them out until
 * they are added to a lineup again (their saved games are untouched).
 */
export async function loadKnownPlayers(): Promise<string[]> {
  const [roster, games] = await Promise.all([loadRoster(), loadGames()]);
  const summary = summarizeByName(games);
  return [...roster].sort(
    (a, b) =>
      (summary[b]?.games ?? 0) - (summary[a]?.games ?? 0) || a.localeCompare(b)
  );
}

export async function rememberPlayers(names: string[]): Promise<void> {
  const roster = await loadRoster();
  const merged = new Set([...roster, ...names]);
  await AsyncStorage.setItem(ROSTER_KEY, JSON.stringify([...merged]));
}

/** Drop a player from the roster. Their finished games stay in history. */
export async function removePlayer(name: string): Promise<void> {
  const roster = await loadRoster();
  await AsyncStorage.setItem(
    ROSTER_KEY,
    JSON.stringify(roster.filter((n) => n !== name))
  );
}

/**
 * Rename a player in the roster and across all saved games, so their
 * lifetime stats follow the new name. The caller is responsible for also
 * renaming them in any game currently in progress, and for ensuring the new
 * name doesn't collide with another player.
 */
export async function renamePlayer(
  oldName: string,
  newName: string
): Promise<void> {
  const [roster, games] = await Promise.all([loadRoster(), loadGames()]);
  const renamedRoster = [
    ...new Set(roster.map((n) => (n === oldName ? newName : n))),
  ];
  const renamedGames = games.map((g) => ({
    ...g,
    config: {
      ...g.config,
      players: g.config.players.map((p) =>
        p.name === oldName ? { ...p, name: newName } : p
      ),
    },
  }));
  await Promise.all([
    AsyncStorage.setItem(ROSTER_KEY, JSON.stringify(renamedRoster)),
    AsyncStorage.setItem(GAMES_KEY, JSON.stringify(renamedGames)),
  ]);
}
