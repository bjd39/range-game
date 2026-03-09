# Range Game

A trivia game where players narrow numeric ranges around AI-generated questions. Built with React 19 + TypeScript + Vite. Uses the Gemini API for question generation/validation.

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # tsc + vite build
npm test             # vitest (single run)
npm run test:watch   # vitest (watch mode)
npm run lint         # eslint
npx tsc --noEmit     # type-check only
```

## Project structure

- `src/App.tsx` — Main app: screens (setup/playing/history), theme toggle, API key, session persistence
- `src/components/GameRound.tsx` — Round orchestrator: question → narrowing → reveal phases. Keyed on `skipCounter` to control re-mounting (not `rounds.length`)
- `src/components/QuestionInput.tsx` — Manual question entry or AI generation with Gemini
- `src/components/NarrowingPhase.tsx` — Players narrow the range with a timer
- `src/components/ResolvePhase.tsx` — Answer input when playing without AI (no pre-set answer)
- `src/components/RevealPhase.tsx` — Answer reveal, win/loss result
- `src/components/SetupScreen.tsx` — Player selection and timer config
- `src/components/Scoreboard.tsx` — Live scores during a game
- `src/components/SessionHistory.tsx` — Browse/manage past sessions
- `src/utils/gemini.ts` — Gemini API calls (validate and generate questions)
- `src/utils/validation.ts` — Range narrowing rules (≥10% reduction, must stay in bounds)
- `src/utils/storage.ts` — localStorage persistence (GameStore with players + sessions)
- `src/utils/dateFormat.ts` — Decimal-year ↔ Date conversion and formatting
- `src/types.ts` — All shared types (Player, Round, Range, GameStore, etc.)

## Conventions

- **No component libraries** — plain CSS with CSS variables for theming
- **Dark mode** — uses CSS variables (`--text`, `--bg`, `--accent`, etc.) defined in `:root` and overridden via `data-theme="dark"` or `prefers-color-scheme`. Buttons need explicit `color: var(--text)` since browsers don't inherit for form elements
- **Styling** — all in `src/index.css`, no CSS modules or styled-components
- **State** — React useState/useCallback only, no external state management
- **Persistence** — localStorage via `src/utils/storage.ts`, no backend
- **Testing** — Vitest with mocked globals (fetch, localStorage). Tests live in `src/__tests__/` and co-located `*.test.ts` files
- **Deploy** — GitHub Pages at base path `/range-game/` (set in vite.config.ts)

## Maintenance

- **Always update this file** when changing project structure, adding/removing files, or altering conventions

## Things to watch out for

- GameRound re-mounts via `key={skipCounter}`. `onRoundComplete` saves data without re-mounting; `onSkipRound` increments the key to start a new round
- The Gemini prompt in `gemini.ts` uses stochastic framing for question variety — be careful editing it
- `QuestionType` can be `"number"` or `"date"`, which changes how ranges and answers are displayed (decimal years)
