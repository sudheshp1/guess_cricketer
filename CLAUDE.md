# CLAUDE.md — Cricket Stats Guessing Game ("Cricdle")

> Working title: **Cricdle** (rename freely). This file is the complete spec and build plan.
> Claude Code: read this whole file before writing code, then build phase by phase (Section 9).
> After each phase, run the app, check the acceptance criteria, and stop for review.

---

## 1. Product summary

A daily web game where players guess a mystery cricketer. Everyone gets the **same player each day**.
After each guess, the game compares the guessed player with the answer across several attributes and
colour-codes each one. Players get **8 guesses**. At the end, they can share an emoji grid result
(no spoilers) to WhatsApp, X, etc.

**Goals**
- Fast: loads in under 2 seconds on a mid-range Android phone over 4G.
- Mobile-first: most players will use phones.
- No login. Stats and progress are stored in the browser.
- Static site: no backend needed for v1. Cheap or free to host.

**Non-goals for v1**
- Accounts, leaderboards, multiplayer, ads, payments.

---

## 2. Game rules

1. A new puzzle unlocks every day at **00:00 IST (Asia/Kolkata)** for all users worldwide.
2. The player types a cricketer's name. An autocomplete dropdown suggests matching players from the
   player database. Only players from the database can be submitted.
3. The same player cannot be guessed twice in one game.
4. After each guess, a row appears showing the guessed player and one coloured cell per attribute.
5. The game ends when the player guesses correctly (win) or uses all 8 guesses (loss).
6. On loss, reveal the answer.
7. After the game ends, show a results modal: answer, guesses used, share button, stats, and a
   countdown to the next puzzle.
8. If the user reloads the page, their in-progress or finished game for today is restored.

### 2.1 Attributes compared (columns)

| Column | Field | Type | Feedback |
|---|---|---|---|
| Country | `country` | category | 🟩 exact match, ⬜ otherwise |
| Role | `role` | category | 🟩 exact, 🟨 "related" (see 2.2), ⬜ otherwise |
| Batting | `battingHand` | `"Right"` / `"Left"` | 🟩 / ⬜ |
| Bowling | `bowlingType` | category | 🟩 exact, 🟨 same family (pace vs spin), ⬜ otherwise |
| Debut | `debutYear` | number | 🟩 exact, 🟨 within ±3 years, ⬜ otherwise; plus arrow ⬆️/⬇️ |
| Intl matches | `intlMatches` | number | 🟩 exact, 🟨 within ±25, ⬜ otherwise; plus arrow |
| Status | `active` | boolean | 🟩 / ⬜ |

Arrow rule: ⬆️ means "the answer is **higher** than your guess", ⬇️ means "lower".
No arrow when the value matches exactly.

### 2.2 Category definitions

**Roles:** `Batter`, `Wicketkeeper-Batter`, `All-rounder`, `Bowler`.
"Related" (🟨) pairs:
- `Batter` ↔ `Wicketkeeper-Batter`
- `All-rounder` ↔ `Batter`
- `All-rounder` ↔ `Bowler`

**Bowling types:** `Right-arm fast`, `Right-arm medium`, `Left-arm fast`, `Left-arm medium`,
`Right-arm off-spin`, `Right-arm leg-spin`, `Left-arm orthodox`, `Left-arm wrist-spin`, `None`.
Families: **pace** = fast + medium variants; **spin** = the four spin types; `None` matches only `None`.

All thresholds (±3 years, ±25 matches) live in one config file (`src/config.ts`) so they can be tuned.

---

## 3. Player data

### 3.1 Schema (`src/data/players.json`)

```json
[
  {
    "id": "virat-kohli",
    "name": "Virat Kohli",
    "aliases": ["Kohli", "King Kohli"],
    "country": "India",
    "role": "Batter",
    "battingHand": "Right",
    "bowlingType": "Right-arm medium",
    "debutYear": 2008,
    "intlMatches": 0,
    "active": true,
    "difficulty": 1
  }
]
```

- `id`: kebab-case, unique, never changes.
- `aliases`: extra strings for autocomplete matching (surnames, nicknames).
- `debutYear`: year of first international match in any format.
- `intlMatches`: total international matches across Tests + ODIs + T20Is.
- `difficulty`: 1 = household name, 2 = known to regular fans, 3 = deep cut.
- **The example above uses placeholder numbers.** All real values must be filled from a verified
  source (see 3.2). Never invent stats.

### 3.2 Data sources

- **Cricsheet** (cricsheet.org): free ball-by-ball data and player registers. License is ODC-By, so
  add an attribution line in the site footer ("Match data from Cricsheet").
- Player attributes like role, batting hand, and bowling type: compile manually and double-check.
- Write the data pipeline as a script (`scripts/build-players.py` or `.ts`) that reads a hand-curated
  CSV (`scripts/players-seed.csv`) and, optionally, Cricsheet data, validates it, and outputs
  `src/data/players.json`.

### 3.3 Validation script (`scripts/validate-players.ts`)

Fail the build if:
- any required field is missing or has a value outside the allowed enums,
- any `id` is duplicated,
- `debutYear` is outside 1877–current year,
- `intlMatches` is negative.

### 3.4 Size

- **Phase 1:** 40–60 well-known players (mostly difficulty 1–2) so the game is playable.
- **Launch:** 300+ players across all major teams, so guesses are useful and the autocomplete feels complete.
- **Answer pool:** only players with `difficulty` 1 or 2 can be the daily answer. All players can be guessed.

---

## 4. Daily puzzle selection

- Compute the puzzle number = days since launch date (`LAUNCH_DATE` in `src/config.ts`), using the
  **Asia/Kolkata** date, not the user's local date.
- Pick the answer deterministically:
  - Preferred: a pre-shuffled schedule file `src/data/schedule.json` (array of player ids, one per day).
    The schedule is generated by `scripts/build-schedule.ts` using a fixed seed and must not repeat an
    answer within 365 days.
  - The app uses `schedule[puzzleNumber % schedule.length]`.
- Note: answers are visible to anyone who reads the JS bundle. That's acceptable for v1. (A later
  version can serve only today's answer hash from an edge function.)

---

## 5. Tech stack

- **Vite + React + TypeScript**
- **Tailwind CSS** for styling
- **Vitest** + **React Testing Library** for tests
- **localStorage** for game state and stats (wrapped in try/catch; the game must still work if storage fails)
- **No backend** in v1
- Hosting: Vercel, Netlify, or Cloudflare Pages (static build)

---

## 6. Project structure

```
cricdle/
├── CLAUDE.md
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── public/
│   ├── favicon.svg
│   └── og-image.png
├── scripts/
│   ├── players-seed.csv
│   ├── build-players.ts
│   ├── validate-players.ts
│   └── build-schedule.ts
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── config.ts              # thresholds, LAUNCH_DATE, MAX_GUESSES
    ├── types.ts               # Player, Feedback, GameState types
    ├── data/
    │   ├── players.json
    │   └── schedule.json
    ├── lib/
    │   ├── date.ts            # IST date + puzzle number + countdown
    │   ├── puzzle.ts          # get today's answer
    │   ├── compare.ts         # guess vs answer -> feedback per attribute
    │   ├── search.ts          # autocomplete matching (name + aliases, accent-insensitive)
    │   ├── share.ts           # build emoji share text
    │   └── storage.ts         # load/save game + stats safely
    ├── hooks/
    │   └── useGame.ts         # game state machine
    └── components/
        ├── Header.tsx
        ├── GuessInput.tsx     # input + autocomplete dropdown, keyboard navigation
        ├── GuessGrid.tsx      # header row + guess rows
        ├── GuessRow.tsx
        ├── FeedbackCell.tsx   # colour + value + arrow, with flip animation
        ├── ResultModal.tsx
        ├── StatsModal.tsx
        ├── HowToPlayModal.tsx
        ├── Countdown.tsx
        └── Footer.tsx         # Cricsheet attribution, disclaimer
```

---

## 7. Core logic details

### 7.1 Types (`src/types.ts`)

```ts
export type Match = "correct" | "close" | "wrong";
export type Direction = "up" | "down" | null;

export interface CellFeedback {
  key: "country" | "role" | "battingHand" | "bowlingType" | "debutYear" | "intlMatches" | "active";
  value: string | number | boolean;   // the guessed player's value, displayed in the cell
  match: Match;
  direction: Direction;               // only for numeric fields
}

export interface GuessResult {
  playerId: string;
  cells: CellFeedback[];
  isCorrect: boolean;
}

export interface SavedGame {
  puzzleNumber: number;
  guesses: string[];                  // player ids, in order
  status: "playing" | "won" | "lost";
}

export interface Stats {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[];             // length MAX_GUESSES; wins by guess count
  lastCompletedPuzzle: number | null;
}
```

### 7.2 `compare(guess, answer)`
Pure function, no side effects, fully unit-tested. Implements Section 2.1 and 2.2 exactly.

### 7.3 Streak rules
- Win: `currentStreak += 1` if `lastCompletedPuzzle === puzzleNumber - 1`, otherwise `currentStreak = 1`.
- Loss: `currentStreak = 0`.
- Update stats only once per puzzle (guard against double-counting on reload).

### 7.4 Search (`search.ts`)
- Case-insensitive, accent-insensitive, matches the start of any word in `name` or any `alias`.
- Exclude already-guessed players.
- Return at most 8 results. Rank exact-prefix matches on the full name first.

### 7.5 Share text (`share.ts`)

```
Cricdle #42 4/8 🏏
⬜🟨🟩⬜🟨⬜🟩
🟩🟨🟩🟨⬜🟨🟩
🟩🟩🟩🟩🟨🟩🟩
🟩🟩🟩🟩🟩🟩🟩
https://your-domain.com
```

- On a win show `N/8` (guesses used); on a loss show `✖/8`.
- Use the Web Share API (`navigator.share`) when available, otherwise copy to clipboard and show a toast.
- Never include player names in the share text.

---

## 8. UI and UX

- **Layout:** single column, max width ~640px, centred. Header (title, ? help, 📊 stats), input,
  grid, footer.
- **Grid on mobile:** 7 attribute columns + name won't fit at 360px. Show the player name as a row
  label above its cells, and keep cells compact (≈44px squares, small text). Allow horizontal scroll
  inside the grid only if unavoidable; never on the page.
- **Colours:** green = correct, amber = close, grey = wrong. Also show the value and arrow inside each
  cell so the game works for colour-blind users. Add a high-contrast mode toggle (orange/blue) in v1.1.
- **Animation:** cells flip in one by one (~150ms apart) on each guess. Respect `prefers-reduced-motion`.
- **Dark mode:** follow system preference.
- **Keyboard:** ↑/↓ to move through suggestions, Enter to submit, Esc to close the dropdown.
- **First visit:** show How to Play modal automatically once.
- **Accessibility:** proper labels, focus management in modals, aria-live announcement of each guess result.

### Legal/branding
- Do **not** use official team logos, board logos, or league names (e.g. "IPL") in branding or assets.
- Footer disclaimer: "Not affiliated with any cricket board or league."
- Country names as text (or neutral flag emoji) are fine.

---

## 9. Build plan (phases)

Build in order. Each phase ends with working, tested code. Stop after each phase for review.

### Phase 1 — Project setup
- Scaffold Vite + React + TS, add Tailwind, Vitest, ESLint, Prettier.
- Create `config.ts`, `types.ts`, and the folder structure above.
- **Done when:** `npm run dev` shows a placeholder page and `npm test` runs.

### Phase 2 — Data
- Create `players-seed.csv` with 40–60 well-known players. Fill attributes from verified sources;
  flag any value you are unsure of with a `TODO_VERIFY` comment column rather than guessing.
- Write `build-players.ts` and `validate-players.ts`; output `players.json`.
- Write `build-schedule.ts` (seeded shuffle of difficulty 1–2 players); output `schedule.json`.
- **Done when:** `npm run data` builds and validates both files with no errors.

### Phase 3 — Core logic (no UI)
- Implement `date.ts`, `puzzle.ts`, `compare.ts`, `search.ts`, `share.ts`, `storage.ts`.
- Unit tests for every rule in Sections 2 and 7, including: each feedback colour per attribute,
  arrow directions, IST midnight boundary (e.g. 23:59 vs 00:00 IST), streak continue/reset,
  storage failure fallback, share text on win and loss.
- **Done when:** all tests pass with good coverage of `compare.ts`.

### Phase 4 — Playable game
- `useGame` hook + `GuessInput`, `GuessGrid`, `GuessRow`, `FeedbackCell`.
- Restore today's game on reload. Win/loss detection.
- **Done when:** you can play a full game in the browser and reload mid-game without losing progress.

### Phase 5 — End of game and stats
- `ResultModal` (answer reveal, share button, countdown), `StatsModal` (played, win %, streaks,
  guess distribution bar chart), `HowToPlayModal` with a worked example.
- **Done when:** sharing works on mobile (Web Share) and desktop (clipboard), and stats update correctly.

### Phase 6 — Polish
- Animations, dark mode, responsive check at 360px / 768px / 1280px, accessibility pass,
  favicon, Open Graph meta tags and `og-image.png` for nice WhatsApp/X link previews.
- **Done when:** Lighthouse scores ≥ 90 for Performance, Accessibility, Best Practices on mobile.

### Phase 7 — Data expansion and launch
- Expand to 300+ players. Regenerate schedule for at least 365 days.
- Add simple privacy-friendly analytics (e.g. Plausible or Cloudflare Web Analytics) — optional.
- Deploy to Vercel/Netlify/Cloudflare Pages. Set `LAUNCH_DATE`.
- **Done when:** the live site serves the correct puzzle at IST midnight.

---

## 10. Future ideas (not in v1)

- Practice / unlimited mode with random players.
- Themed modes: "Legends only", "Women's cricket", "World Cup squads".
- Alternative formats: guess-the-stat-line, guess-the-scorecard, connections-style grouping.
- Hindi / Kannada / Tamil UI translations.
- Server-side answer checking (edge function) so answers aren't in the bundle.
- Optional accounts and friends leaderboards.

---

## 11. Conventions for Claude Code

- TypeScript `strict` mode. No `any` without a comment explaining why.
- Keep game logic in `src/lib/` as pure functions; components stay thin.
- Every bug fix in `lib/` comes with a test.
- Don't add dependencies without a clear reason; prefer small, well-known packages.
- Never fabricate player statistics. If a value can't be verified, mark it `TODO_VERIFY` and tell me.
- Scripts: `npm run dev`, `npm run build`, `npm test`, `npm run data`, `npm run lint`.
