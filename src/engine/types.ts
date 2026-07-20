export type SpecialPosition = 'razorback' | 'trotter' | 'snouter' | 'leaningJowler';

export type Roll =
  | { kind: 'sider' }
  | { kind: 'single'; position: SpecialPosition }
  | { kind: 'double'; position: SpecialPosition }
  | { kind: 'pigOut' }
  | { kind: 'oinker' }
  | { kind: 'piggyback' };

export interface PlayerConfig {
  id: string;
  name: string;
}

export interface GameConfig {
  players: PlayerConfig[];
  targetScore: number;
  startedAt: number;
}

export type GameAction = { type: 'roll'; roll: Roll } | { type: 'bank' };

export interface PlayerState extends PlayerConfig {
  total: number;
  eliminated: boolean;
}

export interface GameState {
  config: GameConfig;
  players: PlayerState[];
  currentPlayerIndex: number;
  turnScore: number;
  turnRolls: Roll[];
  winnerId: string | null;
}

export interface LogEntry {
  playerId: string;
  playerName: string;
  action: GameAction;
  /** Points the action contributed: roll value, or banked amount for a bank. */
  points: number;
  turnScoreAfter: number;
}

/** How a turn ended. `inProgress` is the turn still being rolled. */
export type TurnOutcome =
  | 'banked'
  | 'pigOut'
  | 'oinker'
  | 'piggyback'
  | 'inProgress';

export interface TurnRoll {
  roll: Roll;
  /** Points this roll contributed to the turn. */
  points: number;
}

/** One player's turn: the rolls they took, and how it ended. */
export interface Turn {
  playerId: string;
  playerName: string;
  /** Scoring rolls taken this turn, oldest first. Empty if they pigged out
   *  on the first throw. */
  rolls: TurnRoll[];
  outcome: TurnOutcome;
  /** Points added to the player's total — 0 unless the turn was banked. */
  scored: number;
  /** The player's running total once the turn closed. */
  totalAfter: number;
}
