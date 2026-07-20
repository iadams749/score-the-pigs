# AGENTS.md

Guidance for AI coding agents working in this repository. This is the single
source of truth for agent instructions — `CLAUDE.md` only points here, so put
any new instructions in this file rather than creating parallel docs.

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before
writing any code. This project is on Expo SDK 57 / React Native 0.86 / React 19
with the React Compiler and typed routes enabled (`app.json` → `experiments`).
APIs and file conventions differ from older SDKs, and from most training data.

## Commands

```bash
npm install
npx expo start          # dev server; scan QR with Expo Go, or press `i` for the iOS Simulator
npm run ios             # native build via expo run:ios (requires Xcode)
npm run web
npm run lint            # expo lint
npm test                # jest (jest-expo preset, roots limited to src/)
npm test -- game.test   # single test file by path substring
npm test -- -t "pig out" # single test by name
npx tsc --noEmit        # typecheck; tsconfig is strict
node scripts/generate-icons.js  # regenerate app icons/splash from source art (sharp)
```

There is no test runner watch script beyond `npm test -- --watch`.

## Architecture

The app is a scorekeeper for Pass the Pigs (rules in
`docs/pass-the-pigs-rules.md`; design spec in
`docs/superpowers/specs/2026-07-19-pass-the-pigs-app-design.md`). One phone gets
passed around the table.

**The event log is the source of truth.** A game is stored only as
`{ config, actions: GameAction[] }` — never as derived scores. `src/engine/`
replays the action list from scratch on every render:

- `replay(config, actions)` folds `applyAction` to produce the current
  `GameState` (totals, whose turn, turn score, winner).
- `buildLog(config, actions)` walks the same list to attribute each action to
  the player who took it, producing a flat entry per action.
- `buildTurns(config, actions)` groups that log into `Turn`s — a run of scoring
  rolls plus the action that ended it — for the history feed. The turn being
  rolled comes back with outcome `inProgress`, but only once it has at least
  one roll.

This is why undo is just `actions.slice(0, -1)`, and why history and recap
screens can reconstruct any finished game. **Do not add mutable score state.**
Anything derivable must be derived by replay.

`src/engine/` is pure TypeScript with no React or storage imports, and is the
only unit-tested layer (`src/engine/__tests__/`). New rule logic belongs here
with tests; screens should stay presentational.

- `types.ts` — `Roll` is a discriminated union (`sider | single | double |
  pigOut | oinker | piggyback`); `GameAction` is `roll` or `bank`.
- `scoring.ts` — point values and display labels (`rollLabel`,
  `POSITION_LABELS`, `TURN_OUTCOME_LABELS`). Doubles are `4×` the single value.
  All user-facing labels are Title Case; keep new ones consistent.
- `game.ts` — turn advancement and the three disasters: pig out ends the turn,
  oinker also zeroes the total, piggyback eliminates the player (last player
  standing wins). Those three plus `bank` are exactly what closes a turn, which
  is what `buildTurns` groups on.
- `stats.ts` — `SavedGame` shape plus roll-bucket aggregation over saved games.

App config is split in two: `app.json` holds everything static, and
`app.config.js` is evaluated last to layer in account-specific values from the
environment (currently just `APPLE_TEAM_ID`, needed only for native builds —
see `.env.example`). Put new static config in `app.json`; only things that must
not be checked in belong in `app.config.js`.

`src/state/` is the React/persistence seam over the engine, all AsyncStorage:

- `GameProvider.tsx` — `useGame()` context. Holds the in-progress game under
  key `ptp/currentGame`, auto-persisting on every dispatch. Screens call
  `apply`, `undo`, `newGame`, `finishGame`, `abandonGame`, and read the derived
  `state`, `log`, and `turns` (each a `useMemo` over the action list).
- `stats.ts` — finished games under `ptp/games`, the setup-screen name roster
  under `ptp/roster`. Players are joined **by name**, not id, across games; a
  rename must be applied to both saved games and the in-progress game (see
  `renamePlayer` + `renameInCurrentGame`), and removing someone from the roster
  deliberately leaves their finished games intact.

`src/app/` is Expo Router file-based routing; every route is registered in
`_layout.tsx`, which also loads the Google Fonts and wraps everything in
`GameProvider`. Fonts must be loaded before render (`_layout` returns `null`
until then), so any font referenced in `src/theme.ts` needs a `useFonts` entry.

## Design system

`src/theme.ts` defines the "Felt Table" look: the screen is the table the pigs
are thrown on. Use `colors`, `fonts`, `spacing`, `radius`, and `type` tokens —
do not hardcode colors or font sizes in screens.

`src/components/ui.tsx` provides the physical primitives: `Felt` (full-screen
vignette gradient), `Card` (raised felt with dashed stitch trim), `Button` (a
chip with a thick bottom edge that compresses on press), and `RollChip` (one
roll and its points, shared by the game screen's turn strip and the history
feed). Build new UI from these rather than raw `View`/`Pressable`, so the
tactile metaphor stays consistent — if a visual element shows up on a second
screen, move it here rather than copying its styles. `ConfirmDialog` /
`PromptDialog` are the in-house modals — prefer them over `Alert`.

There is no light mode; the palette is dark-only by design.
