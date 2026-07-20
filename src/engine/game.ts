import { scoreRoll } from './scoring';
import {
  GameAction,
  GameConfig,
  GameState,
  LogEntry,
  Roll,
  Turn,
  TurnOutcome,
  TurnRoll,
} from './types';

export function createGame(config: GameConfig): GameState {
  return {
    config,
    players: config.players.map((p) => ({ ...p, total: 0, eliminated: false })),
    currentPlayerIndex: 0,
    turnScore: 0,
    turnRolls: [],
    winnerId: null,
  };
}

function nextPlayerIndex(state: GameState): number {
  const n = state.players.length;
  let i = state.currentPlayerIndex;
  do {
    i = (i + 1) % n;
  } while (state.players[i].eliminated && i !== state.currentPlayerIndex);
  return i;
}

function advanceTurn(state: GameState): GameState {
  return {
    ...state,
    currentPlayerIndex: nextPlayerIndex(state),
    turnScore: 0,
    turnRolls: [],
  };
}

export function applyAction(state: GameState, action: GameAction): GameState {
  if (state.winnerId !== null) return state;
  const player = state.players[state.currentPlayerIndex];

  if (action.type === 'bank') {
    const total = player.total + state.turnScore;
    const players = state.players.map((p) =>
      p.id === player.id ? { ...p, total } : p
    );
    const next = { ...state, players };
    if (total >= state.config.targetScore) {
      return { ...next, winnerId: player.id, turnScore: 0, turnRolls: [] };
    }
    return advanceTurn(next);
  }

  const { roll } = action;
  switch (roll.kind) {
    case 'sider':
    case 'single':
    case 'double':
      return {
        ...state,
        turnScore: state.turnScore + scoreRoll(roll),
        turnRolls: [...state.turnRolls, roll],
      };
    case 'pigOut':
      return advanceTurn(state);
    case 'oinker': {
      const players = state.players.map((p) =>
        p.id === player.id ? { ...p, total: 0 } : p
      );
      return advanceTurn({ ...state, players });
    }
    case 'piggyback': {
      const players = state.players.map((p) =>
        p.id === player.id ? { ...p, eliminated: true } : p
      );
      const remaining = players.filter((p) => !p.eliminated);
      if (remaining.length === 1) {
        return {
          ...state,
          players,
          winnerId: remaining[0].id,
          turnScore: 0,
          turnRolls: [],
        };
      }
      return advanceTurn({ ...state, players });
    }
  }
}

export function replay(config: GameConfig, actions: GameAction[]): GameState {
  return actions.reduce(applyAction, createGame(config));
}

/** Walk the action list, attributing each action to the player who took it. */
export function buildLog(config: GameConfig, actions: GameAction[]): LogEntry[] {
  const log: LogEntry[] = [];
  let state = createGame(config);
  for (const action of actions) {
    if (state.winnerId !== null) break;
    const player = state.players[state.currentPlayerIndex];
    const points =
      action.type === 'bank' ? state.turnScore : scoreRoll(action.roll);
    state = applyAction(state, action);
    const stillSamePlayersTurn =
      state.winnerId === null &&
      state.players[state.currentPlayerIndex].id === player.id;
    log.push({
      playerId: player.id,
      playerName: player.name,
      action,
      points,
      turnScoreAfter: stillSamePlayersTurn ? state.turnScore : 0,
    });
  }
  return log;
}

/** An action either adds a scoring roll to the turn, or ends it. */
type Step =
  | { kind: 'scores'; roll: Roll }
  | { kind: 'ends'; outcome: TurnOutcome };

function classify(action: GameAction): Step {
  if (action.type === 'bank') return { kind: 'ends', outcome: 'banked' };
  switch (action.roll.kind) {
    case 'pigOut':
    case 'oinker':
    case 'piggyback':
      return { kind: 'ends', outcome: action.roll.kind };
    default:
      return { kind: 'scores', roll: action.roll };
  }
}

/**
 * Group the log into turns for the history feed: a run of scoring rolls plus
 * the action that ended it. The turn currently being rolled comes back as an
 * `inProgress` turn, but only once it has at least one roll — an empty card
 * for a player who has not thrown yet is just noise.
 */
export function buildTurns(config: GameConfig, actions: GameAction[]): Turn[] {
  const turns: Turn[] = [];
  let state = createGame(config);
  let rolls: TurnRoll[] = [];

  for (const entry of buildLog(config, actions)) {
    const player = state.players[state.currentPlayerIndex];
    const step = classify(entry.action);
    state = applyAction(state, entry.action);

    if (step.kind === 'scores') {
      rolls.push({ roll: step.roll, points: entry.points });
      continue;
    }

    turns.push({
      playerId: player.id,
      playerName: player.name,
      rolls,
      outcome: step.outcome,
      scored: step.outcome === 'banked' ? entry.points : 0,
      totalAfter: state.players.find((p) => p.id === player.id)!.total,
    });
    rolls = [];
  }

  if (rolls.length > 0) {
    const player = state.players[state.currentPlayerIndex];
    turns.push({
      playerId: player.id,
      playerName: player.name,
      rolls,
      outcome: 'inProgress',
      scored: 0,
      totalAfter: player.total,
    });
  }

  return turns;
}
