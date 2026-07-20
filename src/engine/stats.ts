import { buildLog, replay } from './game';
import { POSITION_LABELS, scoreRoll } from './scoring';
import { GameAction, GameConfig, Roll, SpecialPosition } from './types';

/** A completed game as persisted for history and stats. */
export interface SavedGame {
  id: string;
  config: GameConfig;
  actions: GameAction[];
  winnerId: string;
  finishedAt: number;
}

export const BUCKET_ORDER = [
  'sider',
  'razorback',
  'trotter',
  'snouter',
  'leaningJowler',
  'doubleRazorback',
  'doubleTrotter',
  'doubleSnouter',
  'doubleLeaningJowler',
  'pigOut',
  'oinker',
  'piggyback',
] as const;

export type RollBucket = (typeof BUCKET_ORDER)[number];

const DOUBLE_BUCKETS: Record<SpecialPosition, RollBucket> = {
  razorback: 'doubleRazorback',
  trotter: 'doubleTrotter',
  snouter: 'doubleSnouter',
  leaningJowler: 'doubleLeaningJowler',
};

export const BUCKET_LABELS: Record<RollBucket, string> = {
  sider: 'Sider',
  razorback: POSITION_LABELS.razorback,
  trotter: POSITION_LABELS.trotter,
  snouter: POSITION_LABELS.snouter,
  leaningJowler: POSITION_LABELS.leaningJowler,
  doubleRazorback: `Double ${POSITION_LABELS.razorback}`,
  doubleTrotter: `Double ${POSITION_LABELS.trotter}`,
  doubleSnouter: `Double ${POSITION_LABELS.snouter}`,
  doubleLeaningJowler: `Double ${POSITION_LABELS.leaningJowler}`,
  pigOut: 'Pig Out',
  oinker: 'Oinker',
  piggyback: 'Piggyback',
};

export const DISASTER_BUCKETS: RollBucket[] = ['pigOut', 'oinker', 'piggyback'];

export function bucketOf(roll: Roll): RollBucket {
  switch (roll.kind) {
    case 'sider':
      return 'sider';
    case 'single':
      return roll.position;
    case 'double':
      return DOUBLE_BUCKETS[roll.position];
    case 'pigOut':
    case 'oinker':
    case 'piggyback':
      return roll.kind;
  }
}

export type Distribution = Record<RollBucket, number>;

export function emptyDistribution(): Distribution {
  return Object.fromEntries(BUCKET_ORDER.map((b) => [b, 0])) as Distribution;
}

/** Throw-by-throw numbers for one player, within a game or across many. */
export interface RollStats {
  rolls: number;
  pointsRolled: number;
  bestRoll: number;
  bestTurn: number;
  banks: number;
  distribution: Distribution;
}

function emptyRollStats(): RollStats {
  return {
    rolls: 0,
    pointsRolled: 0,
    bestRoll: 0,
    bestTurn: 0,
    banks: 0,
    distribution: emptyDistribution(),
  };
}

/** Average points per throw, counting disasters as zero. */
export function avgRoll(stats: RollStats): number {
  return stats.rolls === 0 ? 0 : stats.pointsRolled / stats.rolls;
}

export interface GamePlayerBreakdown extends RollStats {
  playerId: string;
  name: string;
  total: number;
  eliminated: boolean;
  won: boolean;
}

/** Per-player breakdown of a single game, in seating order. */
export function analyzeGame(
  config: GameConfig,
  actions: GameAction[]
): GamePlayerBreakdown[] {
  const state = replay(config, actions);
  const byId = new Map<string, GamePlayerBreakdown>(
    state.players.map((p) => [
      p.id,
      {
        ...emptyRollStats(),
        playerId: p.id,
        name: p.name,
        total: p.total,
        eliminated: p.eliminated,
        won: p.id === state.winnerId,
      },
    ])
  );
  for (const entry of buildLog(config, actions)) {
    const b = byId.get(entry.playerId)!;
    if (entry.action.type === 'bank') {
      b.banks += 1;
      b.bestTurn = Math.max(b.bestTurn, entry.points);
    } else {
      const points = scoreRoll(entry.action.roll);
      b.rolls += 1;
      b.pointsRolled += points;
      b.bestRoll = Math.max(b.bestRoll, points);
      b.distribution[bucketOf(entry.action.roll)] += 1;
    }
  }
  return config.players.map((p) => byId.get(p.id)!);
}

export interface LifetimeAnalysis extends RollStats {
  name: string;
  games: number;
  wins: number;
  totalBanked: number;
}

/** Fold every saved game a player appears in into lifetime numbers. */
export function analyzeLifetime(
  games: SavedGame[],
  name: string
): LifetimeAnalysis {
  const lifetime: LifetimeAnalysis = {
    ...emptyRollStats(),
    name,
    games: 0,
    wins: 0,
    totalBanked: 0,
  };
  for (const game of games) {
    if (!game.config.players.some((p) => p.name === name)) continue;
    const breakdown = analyzeGame(game.config, game.actions).find(
      (b) => b.name === name
    )!;
    lifetime.games += 1;
    if (breakdown.won) lifetime.wins += 1;
    lifetime.totalBanked += breakdown.total;
    lifetime.rolls += breakdown.rolls;
    lifetime.pointsRolled += breakdown.pointsRolled;
    lifetime.banks += breakdown.banks;
    lifetime.bestRoll = Math.max(lifetime.bestRoll, breakdown.bestRoll);
    lifetime.bestTurn = Math.max(lifetime.bestTurn, breakdown.bestTurn);
    for (const bucket of BUCKET_ORDER) {
      lifetime.distribution[bucket] += breakdown.distribution[bucket];
    }
  }
  return lifetime;
}

/** Games/wins per player name, for roster listings. */
export function summarizeByName(
  games: SavedGame[]
): Record<string, { games: number; wins: number }> {
  const summary: Record<string, { games: number; wins: number }> = {};
  for (const game of games) {
    const winnerName = game.config.players.find(
      (p) => p.id === game.winnerId
    )?.name;
    for (const p of game.config.players) {
      const entry = (summary[p.name] ??= { games: 0, wins: 0 });
      entry.games += 1;
      if (p.name === winnerName) entry.wins += 1;
    }
  }
  return summary;
}
