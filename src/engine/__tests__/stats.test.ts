import {
  SavedGame,
  analyzeGame,
  analyzeLifetime,
  avgRoll,
  bucketOf,
  summarizeByName,
} from '../stats';
import { GameAction, GameConfig, Roll } from '../types';

const config = (targetScore = 100): GameConfig => ({
  players: [
    { id: 'a', name: 'Ada' },
    { id: 'b', name: 'Bev' },
  ],
  targetScore,
  startedAt: 0,
});

const roll = (r: Roll): GameAction => ({ type: 'roll', roll: r });
const bank: GameAction = { type: 'bank' };

const saved = (
  id: string,
  actions: GameAction[],
  winnerId: string,
  targetScore = 100
): SavedGame => ({
  id,
  config: config(targetScore),
  actions,
  winnerId,
  finishedAt: 0,
});

describe('bucketOf', () => {
  it('buckets singles, doubles, and disasters distinctly', () => {
    expect(bucketOf({ kind: 'sider' })).toBe('sider');
    expect(bucketOf({ kind: 'single', position: 'snouter' })).toBe('snouter');
    expect(bucketOf({ kind: 'double', position: 'snouter' })).toBe('doubleSnouter');
    expect(bucketOf({ kind: 'pigOut' })).toBe('pigOut');
  });
});

describe('analyzeGame', () => {
  const actions: GameAction[] = [
    roll({ kind: 'single', position: 'snouter' }), // Ada +10
    roll({ kind: 'sider' }), // Ada +1
    bank, // Ada banks 11
    roll({ kind: 'double', position: 'leaningJowler' }), // Bev +60
    roll({ kind: 'pigOut' }), // Bev loses it
    roll({ kind: 'single', position: 'trotter' }), // Ada +5
    bank, // Ada banks 5
  ];

  it('computes per-player throw stats and distribution', () => {
    const [ada, bev] = analyzeGame(config(), actions);

    expect(ada.name).toBe('Ada');
    expect(ada.rolls).toBe(3);
    expect(ada.pointsRolled).toBe(16);
    expect(avgRoll(ada)).toBeCloseTo(16 / 3);
    expect(ada.bestRoll).toBe(10);
    expect(ada.bestTurn).toBe(11);
    expect(ada.banks).toBe(2);
    expect(ada.total).toBe(16);
    expect(ada.distribution.snouter).toBe(1);
    expect(ada.distribution.sider).toBe(1);
    expect(ada.distribution.trotter).toBe(1);

    expect(bev.rolls).toBe(2);
    expect(bev.pointsRolled).toBe(60);
    expect(bev.bestRoll).toBe(60);
    expect(bev.bestTurn).toBe(0);
    expect(bev.total).toBe(0);
    expect(bev.distribution.doubleLeaningJowler).toBe(1);
    expect(bev.distribution.pigOut).toBe(1);
  });

  it('marks the winner and disasters count as zero-point throws', () => {
    const winning: GameAction[] = [roll({ kind: 'sider' }), bank];
    const [ada] = analyzeGame(config(1), winning);
    expect(ada.won).toBe(true);
    const [, bev] = analyzeGame(config(1), winning);
    expect(bev.won).toBe(false);
  });
});

describe('analyzeLifetime', () => {
  const gameOne = saved(
    'g1',
    [roll({ kind: 'double', position: 'snouter' }), bank],
    'a',
    40
  );
  const gameTwo = saved(
    'g2',
    [
      roll({ kind: 'single', position: 'razorback' }), // Ada +5
      roll({ kind: 'pigOut' }),
      roll({ kind: 'sider' }), // Bev +1
      bank,
    ],
    'b',
    1
  );

  it('folds games a player appears in', () => {
    const ada = analyzeLifetime([gameOne, gameTwo], 'Ada');
    expect(ada.games).toBe(2);
    expect(ada.wins).toBe(1);
    expect(ada.rolls).toBe(3);
    expect(ada.pointsRolled).toBe(45);
    expect(ada.bestRoll).toBe(40);
    expect(ada.bestTurn).toBe(40);
    expect(ada.totalBanked).toBe(40);
    expect(ada.distribution.doubleSnouter).toBe(1);
    expect(ada.distribution.razorback).toBe(1);
    expect(ada.distribution.pigOut).toBe(1);
  });

  it('ignores games the player is not in', () => {
    const cal = analyzeLifetime([gameOne], 'Cal');
    expect(cal.games).toBe(0);
    expect(cal.rolls).toBe(0);
  });
});

describe('summarizeByName', () => {
  it('counts games and wins per name', () => {
    const games = [
      saved('g1', [roll({ kind: 'sider' }), bank], 'a', 1),
      saved('g2', [roll({ kind: 'pigOut' }), roll({ kind: 'sider' }), bank], 'b', 1),
    ];
    const summary = summarizeByName(games);
    expect(summary.Ada).toEqual({ games: 2, wins: 1 });
    expect(summary.Bev).toEqual({ games: 2, wins: 1 });
  });
});
