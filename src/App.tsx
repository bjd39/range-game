import { useState, useCallback, useRef, useEffect } from "react";
import type { Player, Round, GameSession, GameStore } from "./types";
import { loadStore, saveStore } from "./utils/storage";
import ApiKeyPrompt from "./components/ApiKeyPrompt";
import SetupScreen from "./components/SetupScreen";
import GameRound from "./components/GameRound";
import Scoreboard from "./components/Scoreboard";
import SessionHistory from "./components/SessionHistory";

type Screen = "setup" | "playing" | "history";

export default function App() {
  const [apiKey, setApiKey] = useState<string | null>(
    () => localStorage.getItem("range-game-api-key")
  );
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">(
    () => (localStorage.getItem("range-game-theme") as "light" | "dark") || "system"
  );

  useEffect(() => {
    if (theme === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
    localStorage.setItem("range-game-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };
  const [store, setStore] = useState<GameStore>(loadStore);
  const [screen, setScreen] = useState<Screen>("setup");
  const [players, setPlayers] = useState<Player[]>([]);
  const [timerDuration, setTimerDuration] = useState(30);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [skipCounter, setSkipCounter] = useState(0);
  const sessionIdRef = useRef(crypto.randomUUID());
  const roundsRef = useRef<Round[]>([]);

  const saveApiKey = useCallback((key: string) => {
    setApiKey(key);
    localStorage.setItem("range-game-api-key", key);
  }, []);

  const persistSession = useCallback((sessionRounds: Round[], sessionPlayers: Player[]) => {
    const currentStore = loadStore();
    const sid = sessionIdRef.current;
    const existingIdx = currentStore.sessions.findIndex((s) => s.id === sid);
    const session: GameSession = {
      id: sid,
      date: new Date().toISOString(),
      playerIds: sessionPlayers.map((p) => p.id),
      rounds: sessionRounds,
    };
    if (existingIdx >= 0) {
      currentStore.sessions[existingIdx] = session;
    } else {
      currentStore.sessions.push(session);
    }
    setStore(currentStore);
    saveStore(currentStore);
  }, []);

  const handleStart = (selectedPlayers: Player[], timer: number) => {
    setPlayers(selectedPlayers);
    setTimerDuration(timer);
    setRounds([]);
    roundsRef.current = [];
    sessionIdRef.current = crypto.randomUUID();

    const freshStore = loadStore();
    const updatedPlayers = [...freshStore.players];
    selectedPlayers.forEach((p) => {
      if (!updatedPlayers.find((ep) => ep.id === p.id)) {
        updatedPlayers.push(p);
      }
    });
    const updated = { ...freshStore, players: updatedPlayers };
    setStore(updated);
    saveStore(updated);
    setScreen("playing");
  };

  const handleRoundComplete = useCallback((round: Round) => {
    const newRounds = [...roundsRef.current, round];
    roundsRef.current = newRounds;
    setRounds(newRounds);
    persistSession(newRounds, players);
  }, [players, persistSession]);

  const handleAddPlayer = useCallback((player: Player) => {
    setPlayers((prev) => {
      const updated = [...prev, player];
      // Persist the new player to store
      const freshStore = loadStore();
      if (!freshStore.players.find((p) => p.id === player.id)) {
        freshStore.players.push(player);
        setStore(freshStore);
        saveStore(freshStore);
      }
      return updated;
    });
  }, []);

  const handleEndGame = () => {
    setStore(loadStore());
    setScreen("setup");
  };

  if (!apiKey) {
    return (
      <div className="app-container">
        <ApiKeyPrompt onSubmit={saveApiKey} />
      </div>
    );
  }

  return (
    <div className="app-container">
      {showKeyInput && (
        <div className="modal-overlay" onClick={() => setShowKeyInput(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <ApiKeyPrompt
              onSubmit={(key) => {
                saveApiKey(key);
                setShowKeyInput(false);
              }}
            />
          </div>
        </div>
      )}

      <header className="app-header">
        <div className="api-indicator">
          <span className="api-dot" />
          API key set
          <button
            className="btn-icon"
            onClick={() => setShowKeyInput(true)}
            title="Change API key"
          >
            ⚙
          </button>
        </div>
        <button
          className="btn-icon theme-toggle"
          onClick={toggleTheme}
          title="Toggle dark mode"
        >
          {theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "☀" : "☾"}
        </button>
      </header>

      {screen === "setup" && (
        <SetupScreen
          existingPlayers={store.players}
          onStart={handleStart}
          onViewHistory={() => { setStore(loadStore()); setScreen("history"); }}
        />
      )}

      {screen === "history" && (
        <SessionHistory
          store={store}
          onStoreUpdate={(s) => {
            setStore(s);
          }}
          onBack={() => setScreen("setup")}
        />
      )}

      {screen === "playing" && (
        <div className="game-layout">
          <div className="game-main">
            <GameRound
              key={`${rounds.length}-${skipCounter}`}
              apiKey={apiKey}
              players={players}
              timerDuration={timerDuration}
              previousQuestions={[
                ...loadStore().sessions.flatMap((s) => s.rounds.map((r) => r.question)),
                ...rounds.map((r) => r.question),
              ].slice(-100)}
              onRoundComplete={handleRoundComplete}
              onSkipRound={() => setSkipCounter((c) => c + 1)}
              onEndGame={handleEndGame}
              roundNumber={rounds.length + 1}
            />
          </div>
          <aside className="game-sidebar">
            <Scoreboard
              players={players}
              rounds={rounds}
              currentHolderId={null}
              onAddPlayer={handleAddPlayer}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
