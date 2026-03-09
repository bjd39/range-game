# Range Game

A browser-based multiplayer party game where players guess numerical answers to trivia questions by iteratively narrowing a range. An AI referee (Gemini Flash) generates and validates questions so no player needs to know the answer in advance.

**Play it:** [bjd39.github.io/range-game](https://bjd39.github.io/range-game/)

## How it works

1. Players enter their names and configure a timer
2. A trivia question with a numerical answer is generated (or manually entered)
3. Players take turns narrowing the range — each narrowing must shrink it by at least 10%
4. When the timer expires (or players end the round), whoever last narrowed "holds the range"
5. The answer is revealed: if it's inside the range, the holder gets +1; if outside, -1

## Features

- AI question generation and validation via Gemini Flash
- Quick-narrow buttons (10% off top/bottom, 5% off both ends)
- Undo moves, skip questions
- Persistent game history and leaderboard in localStorage
- Export/import game data as JSON
- Dark mode (auto or manual toggle)
- No backend — runs entirely in the browser

## Setup

```
npm install
npm run dev
```

You'll need a [Gemini API key](https://aistudio.google.com/apikey) — the app prompts for it on first load.

## Tech stack

Vite + React + TypeScript. No component library, no backend, no database.
