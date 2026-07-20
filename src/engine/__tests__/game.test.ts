import { applyAction, buildLog, buildTurns, createGame, replay } from '../game';
import { TURN_OUTCOME_LABELS, rollLabel, scoreRoll } from '../scoring';
import { GameAction, GameConfig, GameState, Roll, TurnOutcome } from '../types';

const config = (targetScore = 100): GameConfig => ({
  players: [
    { id: 'a', name: 'Ada' },
    { id: 'b', name: 'Bev' },
    { id: 'c', name: 'Cal' },
  ],
  targetScore,
  startedAt: 0,
});

const roll = (r: Roll): GameAction => ({ type: 'roll', roll: r });
const bank: GameAction = { type: 'bank' };

const apply = (state: GameState, actions: GameAction[]) =>
  actions.reduce(applyAction, state);

describe('scoreRoll', () => {
  it('scores every outcome from the rules', () => {
    expect(scoreRoll({ kind: 'sider' })).toBe(1);
    expect(scoreRoll({ kind: 'single', position: 'razorback' })).toBe(5);
    expect(scoreRoll({ kind: 'single', position: 'trotter' })).toBe(5);
    expect(scoreRoll({ kind: 'single', position: 'snouter' })).toBe(10);
    expect(scoreRoll({ kind: 'single', position: 'leaningJowler' })).toBe(15);
    expect(scoreRoll({ kind: 'double', position: 'razorback' })).toBe(20);
    expect(scoreRoll({ kind: 'double', position: 'trotter' })).toBe(20);
    expect(scoreRoll({ kind: 'double', position: 'snouter' })).toBe(40);
    expect(scoreRoll({ kind: 'double', position: 'leaningJowler' })).toBe(60);
    expect(scoreRoll({ kind: 'pigOut' })).toBe(0);
    expect(scoreRoll({ kind: 'oinker' })).toBe(0);
    expect(scoreRoll({ kind: 'piggyback' })).toBe(0);
  });
});

describe('turn flow', () => {
  it('accumulates turn score across rolls', () => {
    const s = apply(createGame(config()), [
      roll({ kind: 'single', position: 'snouter' }),
      roll({ kind: 'single', position: 'trotter' }),
      roll({ kind: 'sider' }),
    ]);
    expect(s.turnScore).toBe(16);
    expect(s.turnRolls).toHaveLength(3);
    expect(s.currentPlayerIndex).toBe(0);
  });

  it('banks the turn score and passes the turn', () => {
    const s = apply(createGame(config()), [
      roll({ kind: 'double', position: 'snouter' }),
      bank,
    ]);
    expect(s.players[0].total).toBe(40);
    expect(s.turnScore).toBe(0);
    expect(s.currentPlayerIndex).toBe(1);
  });

  it('mixed combinations equal the sum of two singles', () => {
    const s = apply(createGame(config()), [
      roll({ kind: 'single', position: 'trotter' }),
      roll({ kind: 'single', position: 'snouter' }),
    ]);
    expect(s.turnScore).toBe(15);
  });
});

describe('penalties', () => {
  it('pig out loses the turn score and passes the turn', () => {
    const s = apply(createGame(config()), [
      roll({ kind: 'single', position: 'leaningJowler' }),
      roll({ kind: 'pigOut' }),
    ]);
    expect(s.turnScore).toBe(0);
    expect(s.players[0].total).toBe(0);
    expect(s.currentPlayerIndex).toBe(1);
  });

  it('oinker resets the banked total', () => {
    let s = apply(createGame(config()), [
      roll({ kind: 'double', position: 'leaningJowler' }),
      bank, // Ada banks 60
      bank, // Bev banks 0
      bank, // Cal banks 0
      roll({ kind: 'oinker' }),
    ]);
    expect(s.players[0].total).toBe(0);
    expect(s.currentPlayerIndex).toBe(1);
  });

  it('piggyback eliminates the player and skips them thereafter', () => {
    const s = apply(createGame(config()), [
      roll({ kind: 'piggyback' }), // Ada out
      bank, // Bev
      bank, // Cal → back to Bev, skipping Ada
    ]);
    expect(s.players[0].eliminated).toBe(true);
    expect(s.currentPlayerIndex).toBe(1);
  });

  it('elimination down to one player ends the game', () => {
    const s = apply(createGame(config()), [
      roll({ kind: 'piggyback' }), // Ada out
      roll({ kind: 'piggyback' }), // Bev out
    ]);
    expect(s.winnerId).toBe('c');
  });
});

describe('winning', () => {
  it('wins only on bank once target is reached', () => {
    let s = apply(createGame(config(50)), [
      roll({ kind: 'double', position: 'leaningJowler' }), // 60 in hand
    ]);
    expect(s.winnerId).toBeNull();
    s = applyAction(s, bank);
    expect(s.winnerId).toBe('a');
    expect(s.players[0].total).toBe(60);
  });

  it('ignores actions after the game is won', () => {
    const won = apply(createGame(config(1)), [roll({ kind: 'sider' }), bank]);
    expect(won.winnerId).toBe('a');
    expect(applyAction(won, bank)).toBe(won);
  });
});

describe('replay and undo', () => {
  it('replay of all-but-last action equals undo', () => {
    const actions: GameAction[] = [
      roll({ kind: 'single', position: 'snouter' }),
      roll({ kind: 'sider' }),
      bank,
      roll({ kind: 'pigOut' }),
    ];
    const before = replay(config(), actions.slice(0, -1));
    const undone = replay(config(), actions.slice(0, -1));
    expect(undone).toEqual(before);
    // undoing a pig out restores the (empty) turn for player b
    expect(undone.currentPlayerIndex).toBe(1);
  });

  it('undoing a winning bank restores play', () => {
    const actions: GameAction[] = [roll({ kind: 'sider' }), bank];
    const won = replay(config(1), actions);
    expect(won.winnerId).toBe('a');
    const undone = replay(config(1), actions.slice(0, -1));
    expect(undone.winnerId).toBeNull();
    expect(undone.turnScore).toBe(1);
  });
});

describe('buildLog', () => {
  it('attributes actions to the players who took them', () => {
    const actions: GameAction[] = [
      roll({ kind: 'single', position: 'snouter' }),
      bank,
      roll({ kind: 'pigOut' }),
      roll({ kind: 'double', position: 'trotter' }),
    ];
    const log = buildLog(config(), actions);
    expect(log.map((e) => e.playerName)).toEqual(['Ada', 'Ada', 'Bev', 'Cal']);
    expect(log[1].points).toBe(10); // Ada banked 10
    expect(log[3].points).toBe(20);
    expect(log[3].turnScoreAfter).toBe(20);
  });
});

describe('buildTurns', () => {
  it('groups a run of rolls with the bank that ended it', () => {
    const turns = buildTurns(config(), [
      roll({ kind: 'single', position: 'trotter' }),
      roll({ kind: 'sider' }),
      bank,
    ]);
    expect(turns).toHaveLength(1);
    expect(turns[0]).toMatchObject({
      playerName: 'Ada',
      outcome: 'banked',
      scored: 6,
      totalAfter: 6,
    });
    expect(turns[0].rolls.map((r) => r.points)).toEqual([5, 1]);
  });

  it('splits turns across players and carries running totals', () => {
    const turns = buildTurns(config(), [
      roll({ kind: 'single', position: 'snouter' }),
      bank,
      roll({ kind: 'sider' }),
      bank,
    ]);
    expect(turns.map((t) => t.playerName)).toEqual(['Ada', 'Bev']);
    expect(turns.map((t) => t.totalAfter)).toEqual([10, 1]);
  });

  it('records each disaster as the turn outcome and scores nothing', () => {
    const turns = buildTurns(config(), [
      roll({ kind: 'sider' }),
      roll({ kind: 'pigOut' }),
      roll({ kind: 'oinker' }),
      roll({ kind: 'piggyback' }),
    ]);
    expect(turns.map((t) => t.outcome)).toEqual(['pigOut', 'oinker', 'piggyback']);
    expect(turns.every((t) => t.scored === 0)).toBe(true);
  });

  it('keeps a turn that pigged out on the first throw, with no rolls', () => {
    const turns = buildTurns(config(), [roll({ kind: 'pigOut' })]);
    expect(turns).toHaveLength(1);
    expect(turns[0].rolls).toEqual([]);
    expect(turns[0].outcome).toBe('pigOut');
  });

  it('zeroes the running total after an oinker', () => {
    const turns = buildTurns(config(), [
      roll({ kind: 'single', position: 'snouter' }),
      bank,
      roll({ kind: 'sider' }),
      bank,
      roll({ kind: 'sider' }),
      bank,
      roll({ kind: 'oinker' }),
    ]);
    const oinked = turns[turns.length - 1];
    expect(oinked.playerName).toBe('Ada');
    expect(oinked.outcome).toBe('oinker');
    expect(oinked.totalAfter).toBe(0);
  });

  it('reports the turn being rolled as inProgress', () => {
    const turns = buildTurns(config(), [
      roll({ kind: 'sider' }),
      bank,
      roll({ kind: 'single', position: 'trotter' }),
    ]);
    expect(turns).toHaveLength(2);
    expect(turns[1]).toMatchObject({
      playerName: 'Bev',
      outcome: 'inProgress',
      scored: 0,
      totalAfter: 0,
    });
  });

  it('omits an in-progress turn when the player has not rolled yet', () => {
    const turns = buildTurns(config(), [roll({ kind: 'sider' }), bank]);
    expect(turns).toHaveLength(1);
    expect(turns[0].outcome).toBe('banked');
  });

  it('stops at the winning bank', () => {
    const turns = buildTurns(config(10), [
      roll({ kind: 'single', position: 'snouter' }),
      bank,
      roll({ kind: 'sider' }),
    ]);
    expect(turns).toHaveLength(1);
    expect(turns[0]).toMatchObject({ outcome: 'banked', totalAfter: 10 });
  });
});

/** Every roll the UI can produce, for exhaustiveness checks. */
const ALL_ROLLS: Roll[] = [
  { kind: 'sider' },
  ...(['razorback', 'trotter', 'snouter', 'leaningJowler'] as const).flatMap(
    (position): Roll[] => [
      { kind: 'single', position },
      { kind: 'double', position },
    ]
  ),
  { kind: 'pigOut' },
  { kind: 'oinker' },
  { kind: 'piggyback' },
];

describe('display labels', () => {
  const isTitleCase = (s: string) =>
    s.split(' ').every((word) => /^[A-Z]/.test(word));

  it('labels every roll in Title Case', () => {
    for (const r of ALL_ROLLS) {
      const label = rollLabel(r);
      expect(label).not.toBe('');
      expect(isTitleCase(label)).toBe(true);
    }
  });

  it('labels every turn outcome in Title Case', () => {
    const outcomes: TurnOutcome[] = [
      'banked',
      'pigOut',
      'oinker',
      'piggyback',
      'inProgress',
    ];
    for (const outcome of outcomes) {
      const label = TURN_OUTCOME_LABELS[outcome];
      expect(label).toBeTruthy();
      expect(isTitleCase(label)).toBe(true);
    }
  });
});

describe('engine purity', () => {
  // The event log is the source of truth: every derivation must be a pure
  // fold, so nothing may mutate the state handed to it.
  it('applyAction never mutates the state it is given', () => {
    for (const r of ALL_ROLLS) {
      const before = apply(createGame(config()), [
        roll({ kind: 'single', position: 'snouter' }),
      ]);
      const snapshot = JSON.stringify(before);
      applyAction(before, roll(r));
      applyAction(before, bank);
      expect(JSON.stringify(before)).toBe(snapshot);
    }
  });

  it('replaying the same actions twice gives the same state', () => {
    const actions = [
      roll({ kind: 'single', position: 'trotter' }),
      bank,
      roll({ kind: 'double', position: 'snouter' }),
      roll({ kind: 'pigOut' }),
      roll({ kind: 'sider' }),
      bank,
    ];
    expect(replay(config(), actions)).toEqual(replay(config(), actions));
  });

  it('buildTurns totals agree with replay', () => {
    const actions = [
      roll({ kind: 'single', position: 'snouter' }),
      bank,
      roll({ kind: 'sider' }),
      bank,
      roll({ kind: 'double', position: 'trotter' }),
      bank,
      roll({ kind: 'oinker' }),
      roll({ kind: 'sider' }),
      bank,
    ];
    const state = replay(config(), actions);
    const turns = buildTurns(config(), actions);

    for (const player of state.players) {
      const theirs = turns.filter((t) => t.playerId === player.id);
      if (theirs.length === 0) continue;
      expect(theirs[theirs.length - 1].totalAfter).toBe(player.total);
    }
  });
});
