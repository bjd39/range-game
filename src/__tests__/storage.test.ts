import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadStore, saveStore, exportStore, importStore } from "../utils/storage";
import type { GameStore } from "../types";

const mockStorage: Record<string, string> = {};

beforeEach(() => {
  Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
  });
});

describe("loadStore", () => {
  it("returns empty store when nothing is saved", () => {
    const store = loadStore();
    expect(store).toEqual({ players: [], sessions: [] });
  });

  it("loads saved data", () => {
    const data: GameStore = {
      players: [{ id: "1", name: "Alice" }],
      sessions: [],
    };
    mockStorage["range-game-store"] = JSON.stringify(data);
    expect(loadStore()).toEqual(data);
  });

  it("returns empty store for corrupted data", () => {
    mockStorage["range-game-store"] = "not json{{{";
    expect(loadStore()).toEqual({ players: [], sessions: [] });
  });
});

describe("saveStore", () => {
  it("persists to localStorage", () => {
    const data: GameStore = {
      players: [{ id: "1", name: "Bob" }],
      sessions: [],
    };
    saveStore(data);
    expect(JSON.parse(mockStorage["range-game-store"])).toEqual(data);
  });
});

describe("exportStore", () => {
  it("returns pretty-printed JSON", () => {
    const data: GameStore = { players: [], sessions: [] };
    saveStore(data);
    const exported = exportStore();
    expect(JSON.parse(exported)).toEqual(data);
    expect(exported).toContain("\n"); // pretty-printed
  });
});

describe("importStore", () => {
  it("saves and returns valid data", () => {
    const data: GameStore = {
      players: [{ id: "x", name: "Test" }],
      sessions: [],
    };
    const result = importStore(JSON.stringify(data));
    expect(result).toEqual(data);
    expect(JSON.parse(mockStorage["range-game-store"])).toEqual(data);
  });

  it("throws on invalid format", () => {
    expect(() => importStore('{"players": "not array"}')).toThrow();
  });

  it("throws on invalid JSON", () => {
    expect(() => importStore("nope")).toThrow();
  });
});
