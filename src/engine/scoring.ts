import { Roll, SpecialPosition, TurnOutcome } from './types';

export const SINGLE_VALUES: Record<SpecialPosition, number> = {
  razorback: 5,
  trotter: 5,
  snouter: 10,
  leaningJowler: 15,
};

export const POSITION_LABELS: Record<SpecialPosition, string> = {
  razorback: 'Razorback',
  trotter: 'Trotter',
  snouter: 'Snouter',
  leaningJowler: 'Leaning Jowler',
};

export const TURN_OUTCOME_LABELS: Record<TurnOutcome, string> = {
  banked: 'Banked',
  pigOut: 'Pig Out',
  oinker: 'Oinker',
  piggyback: 'Piggyback',
  inProgress: 'Rolling…',
};

export function scoreRoll(roll: Roll): number {
  switch (roll.kind) {
    case 'sider':
      return 1;
    case 'single':
      return SINGLE_VALUES[roll.position];
    case 'double':
      return SINGLE_VALUES[roll.position] * 4;
    case 'pigOut':
    case 'oinker':
    case 'piggyback':
      return 0;
  }
}

export function rollLabel(roll: Roll): string {
  switch (roll.kind) {
    case 'sider':
      return 'Sider';
    case 'single':
      return POSITION_LABELS[roll.position];
    case 'double':
      return `Double ${POSITION_LABELS[roll.position]}`;
    case 'pigOut':
      return 'Pig Out';
    case 'oinker':
      return 'Oinker';
    case 'piggyback':
      return 'Piggyback';
  }
}
