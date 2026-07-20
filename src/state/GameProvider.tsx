import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';

import { buildLog, buildTurns, replay } from '@/engine/game';
import { GameAction, GameConfig, GameState, LogEntry, Turn } from '@/engine/types';
import { saveFinishedGame } from '@/state/stats';

const GAME_KEY = 'ptp/currentGame';

export interface StoredGame {
  config: GameConfig;
  actions: GameAction[];
}

type StoreAction =
  | { type: 'hydrate'; game: StoredGame | null }
  | { type: 'new'; config: GameConfig }
  | { type: 'apply'; action: GameAction }
  | { type: 'undo' }
  | { type: 'rename'; oldName: string; newName: string }
  | { type: 'clear' };

function storeReducer(game: StoredGame | null, action: StoreAction): StoredGame | null {
  switch (action.type) {
    case 'hydrate':
      return action.game;
    case 'new':
      return { config: action.config, actions: [] };
    case 'apply':
      return game ? { ...game, actions: [...game.actions, action.action] } : game;
    case 'undo':
      return game ? { ...game, actions: game.actions.slice(0, -1) } : game;
    case 'rename':
      if (!game) return game;
      return {
        ...game,
        config: {
          ...game.config,
          players: game.config.players.map((p) =>
            p.name === action.oldName ? { ...p, name: action.newName } : p
          ),
        },
      };
    case 'clear':
      return null;
  }
}

interface GameContextValue {
  ready: boolean;
  game: StoredGame | null;
  state: GameState | null;
  log: LogEntry[];
  /** The same log grouped into turns, for the history feed. */
  turns: Turn[];
  newGame: (config: GameConfig) => void;
  apply: (action: GameAction) => void;
  undo: () => void;
  canUndo: boolean;
  /** Save the finished game to history and clear it. Returns the saved id. */
  finishGame: () => Promise<string | null>;
  /** Discard the in-progress game without saving anything to history. */
  abandonGame: () => void;
  /** Apply a player rename to the in-progress game, if they are in it. */
  renameInCurrentGame: (oldName: string, newName: string) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [game, dispatch] = useReducer(storeReducer, null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(GAME_KEY)
      .then((raw) => {
        if (raw) dispatch({ type: 'hydrate', game: JSON.parse(raw) as StoredGame });
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (game) {
      AsyncStorage.setItem(GAME_KEY, JSON.stringify(game)).catch(() => {});
    } else {
      AsyncStorage.removeItem(GAME_KEY).catch(() => {});
    }
  }, [game, ready]);

  const state = useMemo(
    () => (game ? replay(game.config, game.actions) : null),
    [game]
  );
  const log = useMemo(
    () => (game ? buildLog(game.config, game.actions) : []),
    [game]
  );
  const turns = useMemo(
    () => (game ? buildTurns(game.config, game.actions) : []),
    [game]
  );

  const newGame = useCallback((config: GameConfig) => {
    dispatch({ type: 'new', config });
  }, []);
  const apply = useCallback((action: GameAction) => {
    dispatch({ type: 'apply', action });
  }, []);
  const undo = useCallback(() => {
    dispatch({ type: 'undo' });
  }, []);
  const abandonGame = useCallback(() => {
    dispatch({ type: 'clear' });
  }, []);
  const renameInCurrentGame = useCallback((oldName: string, newName: string) => {
    dispatch({ type: 'rename', oldName, newName });
  }, []);

  const finishGame = useCallback(async () => {
    let savedId: string | null = null;
    if (game && state?.winnerId) {
      savedId = await saveFinishedGame(game.config, game.actions, state.winnerId)
        .then((saved) => saved.id)
        .catch(() => null);
    }
    dispatch({ type: 'clear' });
    return savedId;
  }, [game, state]);

  const value: GameContextValue = {
    ready,
    game,
    state,
    log,
    turns,
    newGame,
    apply,
    undo,
    canUndo: (game?.actions.length ?? 0) > 0,
    finishGame,
    abandonGame,
    renameInCurrentGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
