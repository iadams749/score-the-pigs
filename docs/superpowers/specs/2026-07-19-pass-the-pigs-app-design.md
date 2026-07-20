# Pass the Pigs Companion App — Design

Date: 2026-07-19
Status: Approved (user approved design in conversation; review gates waived)

## Purpose

A phone-based scorekeeping companion for the physical dice game Pass the Pigs
(rules: `docs/pass-the-pigs-rules.md`). One phone is passed around or held by a
scorekeeper; the app does all scoring math, tracks turns, and keeps light
history/stats. iOS-first via Expo; Android comes for free later.

Not in scope: online play, multi-device sync, accounts, Hog Call variant,
celebration animations (deferred to a later version).

## v1 Features

- **Game setup**: 2+ players by name, target score (default 100).
- **Roll pad**: one tap per outcome; the app computes all points.
- **Turn tracking**: running turn score, Bank, automatic turn passing, and
  automatic penalty handling (Pig Out, Oinker, Piggyback).
- **Scoreboard**: totals, current player highlight, progress to target, win
  detection and game-over screen.
- **Undo**: unlimited, across turn boundaries.
- **Persistence**: game survives app restarts; autosaved on every action.
- **Roll history**: per-game log of every throw.
- **Player stats**: lifetime per-name stats (games, wins, highest roll,
  Pig Outs, Oinkers, Piggybacks) stored on-device.

## Roll pad model (opinionated simplification)

Every outcome is a single tap:

- `Sider` (1)
- One button per special position at single value: Razorback 5, Trotter 5,
  Snouter 10, Leaning Jowler 15 — meaning "one pig in this position".
- A paired `×2` button per position for doubles: 20 / 20 / 40 / 60.
- Disaster buttons, visually separated and red: Pig Out, Oinker, Piggyback.
- Bank (brass) and Undo.

Mixed combinations (two different special positions) need no dedicated UI:
their value equals the sum of the two singles, so the scorekeeper taps both
position buttons. The history shows two entries for such a roll; this is an
accepted trade-off for a dramatically simpler pad.

## Rules encoding

- Scoring roll: adds to turn score; player chooses to keep rolling or bank.
- Pig Out: turn score lost, turn passes.
- Oinker: player's banked total reset to 0, turn score lost, turn passes.
- Piggyback: player eliminated; if only one non-eliminated player remains,
  they win immediately.
- Bank: turn score added to total; if total >= target, player wins.
- Win happens only on bank (or by elimination of all others).

## Architecture

- **Expo (managed workflow) + TypeScript**, Expo Router for navigation.
- **Pure game engine** in `src/engine/`: no React imports.
  - `types.ts` — positions, roll outcomes, actions, state.
  - `scoring.ts` — `scoreRoll(roll): number`.
  - `game.ts` — `createGame(config)`, `applyAction(state, action)`, and
    `replay(config, actions)`.
- **Event sourcing**: the stored game is `{config, actions[]}`. Current state
  is a fold over actions. Undo pops the last action and replays — this gives
  undo across any boundary and doubles as the roll-history data source.
- **Store**: React context + `useReducer` wrapping the engine
  (`src/state/GameProvider.tsx`). Autosaves to AsyncStorage on every action.
- **Persistence keys**: `ptp/currentGame` (event log), `ptp/stats`
  (per-player-name aggregates, updated when a game completes).
- **Theme** (`src/theme.ts`): Felt Table tokens —
  surface `#1E4034`, card `#2A5343`, text `#F6F3E8`, accent pink `#F2A0B5`,
  brass `#D9A441`, danger `#C9503E`. System font, heavy weights for scores.

## Screens (Expo Router)

- `app/index.tsx` — Home: New Game, Resume (if in progress), Stats link.
- `app/setup.tsx` — players + target score, Start.
- `app/game.tsx` — scoreboard strip, turn area (big turn score + this turn's
  rolls), roll pad; win overlay with Rematch / New Game on game end.
- `app/history.tsx` — roll log of current game.
- `app/stats.tsx` — lifetime player stats.

## Edge cases

- Duplicate player names disambiguated at setup ("Sam 2").
- Undo of a game-winning bank restores play.
- Eliminating down to one player ends the game.
- Killing the app mid-game loses nothing (event log replay).

## Testing

Jest (jest-expo preset) unit tests on the engine: every scoring value from the
rules doc, doubles, penalties, elimination, win-on-bank, and undo/replay
round-trips. UI kept thin; no UI tests in v1.
