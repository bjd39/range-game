import type { GameStore } from "../types";

const STORAGE_KEY = "range-game-store";

export function loadStore(): GameStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Corrupted data — start fresh
  }
  return { players: [], sessions: [] };
}

export function saveStore(store: GameStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function exportStore(): string {
  return JSON.stringify(loadStore(), null, 2);
}

export function importStore(json: string): GameStore {
  const store = JSON.parse(json) as GameStore;
  if (!Array.isArray(store.players) || !Array.isArray(store.sessions)) {
    throw new Error("Invalid game store format");
  }
  saveStore(store);
  return store;
}
