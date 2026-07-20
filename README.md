# Score the Pigs 🐷

A mobile scorekeeping companion for the dice game
[Pass the Pigs](docs/pass-the-pigs-rules.md). One phone, passed around the
table: it does the pig math, tracks turns and penalties, and keeps lifetime
player stats.

Built with [Expo](https://expo.dev) (React Native + TypeScript, Expo Router).

## Running it

```bash
npm install
npx expo start
```

Then scan the QR code with the **Expo Go** app on your phone (same Wi-Fi
network), or press `i` to open the iOS Simulator (requires Xcode).

For a **native iOS build** (`npm run ios`) you also need your own Apple Team
ID: `cp .env.example .env` and fill in `APPLE_TEAM_ID`. It isn't needed for the
Expo Go workflow above.

## Checks

The game engine (`src/engine/`) is pure TypeScript and fully unit tested:

```bash
npm test           # jest
npm run lint       # expo lint
npx tsc --noEmit   # typecheck
```

## Project layout

- `src/engine/` — pure game logic: scoring, turn/penalty rules, event-log
  replay (powers undo and history). No React imports.
- `src/state/` — React context around the engine + AsyncStorage persistence.
- `src/app/` — Expo Router screens: home, setup, game, roll history, rules,
  players, per-player stats, and game recaps.
- `src/theme.ts` — the "Felt Table" palette.
- `docs/` — game rules and the design spec
  (`docs/superpowers/specs/2026-07-19-pass-the-pigs-app-design.md`).

A game is stored only as its event log, so scores are always re-derived by
replay — see [AGENTS.md](AGENTS.md) for the full architecture notes.

## License

MIT — see [LICENSE](LICENSE).
