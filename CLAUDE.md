# CLAUDE.md — Cricket Stats Guessing Game ("Cricdle")

> Working title: **Cricdle** (rename freely). This file is the complete spec and build plan.
> **Current design: endless clue mode** (Section 2). The original daily-puzzle design (v1) was
> replaced; see Section 9, Phase 8.
> Claude Code: read this whole file before writing code, then build phase by phase (Section 9).
> After each phase, run the app, check the acceptance criteria, and stop for review.

---

## 1. Product summary

An endless web game where players identify a mystery international cricketer from clues. Each round
starts with one vague clue; every wrong guess (or a skip) reveals the next, more specific clue.
There are **10 clues** per round, and players can play as many rounds as they like. They can share
a spoiler-free emoji summary of a round to WhatsApp, X, etc.

**Goals**
- Fast: loads in under 2 seconds on a mid-range Android phone over 4G.
- Mobile-first: most players will use phones.
- No login. Stats and progress are stored in the browser.
- Static site: no backend needed. Cheap or free to host.

**Non-goals for now**
- Accounts, leaderboards, multiplayer, ads, payments.

---

## 2. Game rules

1. A round picks a random answer from the chosen **player pool** (2.2), avoiding the last 50
   answers when possible.
2. Clue 1 is shown at the start. The player types a cricketer's name; an autocomplete dropdown
   suggests players from the database. Only players from the database can be submitted, and the
   same player can't be guessed twice in a round.
3. A wrong guess reveals the next clue. **Another clue** reveals the next clue without guessing.
   **Give up** ends the round.
4. A correct guess wins; the score is the clue number it was solved on (lower is better). A wrong
   guess while all 10 clues are showing loses the round.
5. When a round ends, show the answer, a **Next player** button, a **Share** button, and the clues
   that weren't revealed.
6. Reloading restores the round in progress (or the finished round, until Next player).

### 2.1 Clues (in order, vaguest first)

| # | Clue | Example |
|---|---|---|
| 1 | Role | Batter |
| 2 | Country (neutral wording; must not hint at retirement) | India |
| 3 | Batting hand + bowling style | Right-handed batter, bowls right-arm medium |
| 4 | International debut year | International debut in 2008 |
| 5 | Status | Still playing international cricket / Retired · last international match in 2013 |
| 6 | International matches, split by format | 563 international matches (123 Tests, 315 ODIs, 125 T20Is) |
| 7 | Runs by format + highest score | Runs: 9,230 in Tests, … · Highest score 254* (Test) |
| 8 | Wickets by format + best bowling | Wickets: 0 in Tests, 5 in ODIs, … · Best 1/13 (ODI) |
| 9 | Hundreds and fifties | 86 international hundreds (30 Test, 55 ODI, 1 T20I) · 148 fifties |
| 10 | Name shape: first letters + word lengths | V____  K____ |

Clues 7–9 carry a note "Career figures from Wikipedia, as of <date>". No clue before the last may
contain the player's name. Clue text lives in `src/lib/clues.ts` (pure, unit-tested).

### 2.2 Player pools

| Pool | Answers drawn from |
|---|---|
| Famous | `difficulty` 1 |
| Regular (default) | `difficulty` 1–2 |
| All | every player |

Changing the pool applies from the next round. Any player can always be *guessed*.

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
- `stats`: per-format (`test`, `odi`, `t20i`) career figures: `matches`, `runs`, `highScore`
  (e.g. `"254*"`), `hundreds`, `fifties`, `wickets`, `bestBowling` (e.g. `"5/23"`); null where the
  source shows none. Only formats the player played are present.
- `lastYear`: year of the last international match, if known. `statsAsOf`: the infobox "as of" date.
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
- **Answer pools:** see 2.2. All players can be guessed.

---

## 4. Round selection

- `pickAnswer(players, pool, recentIds, random)` in `src/lib/round.ts` picks uniformly from the pool,
  excluding the last `RECENT_ANSWER_MEMORY` (50) answers unless that empties the pool.
- `random` is injectable so tests are deterministic.
- Answers are visible to anyone who reads the JS bundle. That's acceptable.

---

## 5. Tech stack

- **Vite + React + TypeScript**
- **Tailwind CSS** for styling
- **Vitest** + **React Testing Library** for tests
- **localStorage** for game state and stats (wrapped in try/catch; the game must still work if storage fails)
- **Vercel Speed Insights** and **Web Analytics** (`@vercel/speed-insights/react`,
  `@vercel/analytics/react`, rendered in `src/main.tsx`)
- **No backend** in v1
- Hosting: Vercel, Netlify, or Cloudflare Pages (static build)

---

## 6. Project structure

```
├── CLAUDE.md
├── index.html                 # meta + Open Graph tags (%VITE_SITE_URL%)
├── vercel.json
├── public/                    # favicon.svg, apple-touch-icon.png, og-image.png, robots.txt
├── scripts/
│   ├── players-seed.csv       # curated list: id, name, Wikipedia title, aliases, difficulty, overrides
│   ├── fetch-sources.ts       # network: snapshot Wikipedia + Cricsheet into scripts/sources/
│   ├── build-players.ts       # offline: seed + snapshots -> src/data/players.json + report.md
│   ├── validate-players.ts
│   ├── assets/                # HTML sources for og-image.png and apple-touch-icon.png
│   ├── sources/               # committed snapshots + build report
│   └── lib/                   # csv, infobox parsing, resolve (merge rules), validate
└── src/
    ├── App.tsx
    ├── config.ts              # MAX_CLUES, RECENT_ANSWER_MEMORY, storage keys, SITE_URL
    ├── types.ts               # Player, FormatStats, Round, Clue, Stats
    ├── data/players.json
    ├── lib/
    │   ├── clues.ts           # player -> 10 clues
    │   ├── round.ts           # pickAnswer, newRound, guess, revealClue, giveUp
    │   ├── stats.ts           # recordRound (once per round), win %, average clues
    │   ├── search.ts          # autocomplete matching (name + aliases, accent-insensitive)
    │   ├── share.ts           # emoji share text + Web Share / clipboard
    │   ├── storage.ts         # load/save round, stats, recent answers, pool, help-seen
    │   └── players.ts         # bundled player data
    ├── hooks/useGame.ts       # round state machine + persistence
    └── components/            # Header, ClueList, GuessInput, RoundResult, PoolPicker,
                               # StatsModal/StatsPanel, HowToPlayModal, Modal, Toast, Footer, Icons
```

---

## 7. Core logic details

### 7.1 Types (`src/types.ts`)

```ts
export interface Round {
  roundId: string           // unique; guards against double-counting stats
  answerId: string
  guesses: string[]         // player ids, in order
  cluesRevealed: number     // 1..MAX_CLUES
  status: 'playing' | 'won' | 'lost'
  gaveUp: boolean
}

export interface Stats {
  played: number
  wins: number
  currentStreak: number     // rounds won in a row
  maxStreak: number
  distribution: number[]    // length MAX_CLUES; wins by clue number solved on
  lastRoundId: string | null
}
```

### 7.2 Round rules (`round.ts`)
- `guess`: correct -> `won`; wrong -> next clue, or `lost` if all clues were showing. Repeats and
  guesses after the round ends are no-ops (return the same object).
- `revealClue`: next clue without guessing; no-op at `MAX_CLUES`. `giveUp`: `lost`, `gaveUp: true`.

### 7.3 Stats rules
- Win: `currentStreak += 1`; record the clue number in `distribution`. Loss or give-up: streak = 0.
- Record each round once (`lastRoundId` guard), including after a reload.

### 7.4 Search (`search.ts`)
- Case-insensitive, accent-insensitive, matches the start of any word in `name` or any `alias`.
- Exclude already-guessed players. At most 8 results; exact-prefix matches on the full name first.

### 7.5 Share text (`share.ts`)

```
Cricdle 🏏 3/10 clues
🟥🟥🟩⬜⬜⬜⬜⬜⬜⬜
🔥 4 in a row
https://your-domain.com
```

- One square per clue: 🟥 used before the answer, 🟩 the clue it was solved on, ⬜ not needed.
  A loss shows `✖/10` and red squares for the clues revealed. The streak line appears for streaks > 1.
- Web Share API when available, otherwise copy to clipboard and show a toast. Never include names.

---

## 8. UI and UX

- **Layout:** fills the whole window on every device; no fixed max width, no horizontal scroll.
  - Phones and tablets (< 1024px): one full-width column: header, "Who is this cricketer?" with
    "Clue N of 10", revealed clues (newest highlighted), then the guess input with **Another clue**
    / **Give up**, the player's wrong guesses, and the player-pool picker.
  - Laptops/desktops (>= 1024px): two columns across the full width: clues on the left, a sticky
    control panel (input or result card, guesses, pool picker) on the right.
  - Very wide screens (>= 1536px): clue cards flow into two columns and the root font size scales
    up slightly (106%, then 112.5% at >= 1920px).
- **Visual design ("night match"):** colour tokens live in `src/index.css` (`--bg`, `--surface`,
  `--ink`, `--muted`, `--brand`, `--gold`, `--ball`, …) with a light "day match" theme (cream
  whites) and a dark "night match" theme (floodlit deep green), switched by system preference.
  Use the semantic Tailwind colours (`bg-surface`, `text-muted`, `border-line`, `text-brand`, …)
  and the component classes `.card`, `.btn`, `.btn-primary`, `.btn-ghost`, `.icon-btn`,
  `.eyebrow`, never raw palette colours. Font: Outfit (self-hosted via
  `@fontsource-variable/outfit`). Icons: `lucide-react`; the cricket ball (logo, mystery badge) is
  `CricketBall` in `components/Icons.tsx`; per-clue icons are in `components/clueIcons.ts`.
  Keep every text/background pair at WCAG AA in both themes.
- **Round over:** the result card replaces the input (so it stays on screen on phones); clues that
  weren't revealed are listed after the controls on small screens and under the clues on large ones.
- **Animation:** each new clue slides in. Respect `prefers-reduced-motion`. Modals shown on page
  load don't animate.
- **Dark mode:** follow system preference.
- **Keyboard:** ↑/↓ to move through suggestions, Enter to submit, Esc to close the dropdown.
  The input is focused when a new round starts.
- **First visit:** show How to Play once.
- **Accessibility:** proper labels, focus management in modals, aria-live announcement of each
  guess result and newly revealed clue.

---

### Legal/branding
- Do **not** use official team logos, board logos, or league names (e.g. "IPL") in branding or assets.
- Footer disclaimer: "Not affiliated with any cricket board or league."
- Country names as text (or neutral flag emoji) are fine.

---

## 9. Build plan (phases)

Phases 1–7 built the original **daily** game and are kept for history. Phase 8 replaced the daily
puzzle with endless clue mode; where they conflict, Sections 1–8 (current design) win.

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

### Phase 8 — Endless clue mode (done)
- Replace the daily puzzle, schedule, countdown and comparison grid with endless rounds of 10
  progressive clues, player pools, and per-round stats.
- Extend the data pipeline with per-format career figures (runs, high score, 100s/50s, wickets,
  best bowling) from the Wikipedia infobox snapshots, plus `lastYear` and `statsAsOf`.

---

### Phases 9–13 — "Mind Reader" mode (planned, not started)

A second mode where the roles swap: the **user thinks of a cricketer** and the game asks yes/no
questions until it guesses who it is. The existing clue mode stays as it is; Mind Reader gets its
own logic, state, storage keys and stats.

**Round rules (proposed defaults; confirm before Phase 9)**
1. The user thinks of any player in the database and presses **Start**.
2. The game asks one question at a time; the user answers **Yes / No / Not sure**.
3. When confident, the game asks "Is it **<name>**?". Yes → the game wins. No → that player is
   ruled out and questioning continues.
4. Budget: **10 questions plus up to 3 "Is it X?" guesses**. (A simulation over the 508-player
   data, with perfect answers, needed about 9 questions on average. Counting guesses inside the 10
   gave only ~93–95% success.)
5. If the budget runs out, or every player has been ruled out, the game says it's beaten and asks
   "Who was it?" (existing autocomplete). If the answers contradict the player's data, it says so
   gently ("one of the answers didn't match my data").
6. The user may think of **any** player; famous (`difficulty` 1) players are favoured.
7. Reloading restores the round in progress.

**Key design points**
- **Soft scoring, not hard elimination:** each candidate has a score. A contradicting answer
  multiplies it by `MIND_ERROR_RATE` (0.1) instead of deleting it, so one wrong answer doesn't
  ruin the round. "Not sure" changes nothing; unknown data counts as a coin flip.
- **Prior:** start scores weighted by difficulty (e.g. 1 → 4, 2 → 2, 3 → 1).
- **Question choice:** the unasked question with the highest expected information gain over the
  current scores. Ties go to the easier question.
- **When to guess:** when the top candidate holds ≥ 50% (`MIND_GUESS_THRESHOLD`) of the total
  score, when no question is worth asking, or when the question budget is used up.
- **Questions must be easy for a fan to answer:** round thresholds ("100+ Tests", "debut before
  2000"), never odd numbers. A question whose data is missing for a player counts as "unknown" for
  that player, never as a contradiction.
- Answers are visible in the bundle, as in clue mode. That's acceptable.

#### Phase 9 — Question bank (no UI) (done)
- Add `src/lib/questions.ts`: about 60–70 `Question` objects (`id`, `text`, `difficulty: easy |
  medium | hard`, `test(player) => boolean | null`). Cover role, country, region (Asia / SENA /
  other), batting hand, pace / spin / left-arm, still playing, debut and last-match eras,
  international and per-format match counts, career runs / wickets / hundreds thresholds.
- Add any types needed to `types.ts` and constants to `config.ts` (`MIND_MAX_QUESTIONS = 10`,
  `MIND_MAX_GUESSES = 3`, `MIND_GUESS_THRESHOLD`, `MIND_ERROR_RATE`, `MIND_PRIOR_WEIGHTS`).
- Make sure no two players give the same answers (the final 84-question bank separates all 508).
- Tests: every question gives a boolean or null for every player; ids are unique; no question text
  names a player; every pair of players differs on at least one question.
- **Done when:** `npm test` passes and a test confirms that every player has a unique answer pattern.

#### Phase 10 — Guessing engine (no UI) (done)
- `src/lib/mind.ts`, pure functions over a `MindEngine` built once by `createEngine(players,
  questions, options?)` (precomputed answer matrix): `newMindRound(roundId)`, `scores`, `ranking`,
  `bestQuestion`, `nextMove` (question, guess or null), `answerQuestion`, `answerGuess`,
  `concede`, `reveal`, `mismatches` (answers that disagree with a player's data),
  `isValidMindRound`.
- `MindRound` state: `roundId`, ordered `turns` (`{ kind: 'question', questionId, answer }` |
  `{ kind: 'guess', playerId, correct }`), `status: 'playing' | 'won' | 'lost'`, `revealedId`.
  The next move is recomputed from the turns, so nothing else needs saving. Repeated actions and
  actions after the round ends are no-ops (return the same object).
- Tests: scoring with yes/no/not sure, soft contradiction, prior weighting, question choice,
  guess threshold, budget limits, the "all ruled out" path, no-op rules.
- **Simulation test:** for every player in the regular pool, play a full round with perfect
  answers, then with one random wrong answer. Require ≥ 95% (perfect) and ≥ 45% (one wrong answer)
  of wins within budget, so data growth can't silently break the game. At the time of writing:
  100% with 9.6 questions on average, and ~58% with one wrong answer.
- **Done when:** all tests pass and the simulation success rates are reported in the test output.

#### Phase 11 — Mind Reader UI (done)
- Add `hooks/useMindReader.ts` (state machine + persistence), and the components
  `MindQuestionCard` (question and three large buttons), `MindHistory` (questions and answers so
  far), `MindResult` ("Got it in 7!" / "You beat me", Play again, Share), and `MindReveal` ("Who
  was it?" using `GuessInput`).
- Add a mode switch to the header: *Guess the player* / *Mind Reader*. Remember the chosen mode
  in storage. (Built as `ModeSwitch` under the header; `MindHero` shows question and guess pips;
  the result and reveal live in `MindResult`; the engine instance is `MIND_ENGINE` in the hook.)
- Follow Section 8: same tokens and component classes, phone and desktop layouts, slide-in
  animation respecting reduced motion, Y / N / ? keyboard shortcuts, aria-live for each new
  question and guess, focus moves to the answer buttons each turn.
- **Done when:** you can play a full Mind Reader round in the browser at 360px / 768px / 1280px,
  switch modes without losing either mode's round, and reload mid-round without losing progress.

#### Phase 12 — Stats, sharing, How to Play
- Storage: new keys `cricdle:mind:round:v1`, `cricdle:mind:stats:v1`, `cricdle:mode:v1`
  (try/catch like the rest).
- Mind stats: rounds played, game win %, questions-used distribution for wins. Record each round
  once (`roundId` guard). Show them in the stats modal under a Mind Reader tab.
- Share text with no names, e.g. `Cricdle Mind Reader 🧠 guessed me in 7/10` / `… I beat it!`.
- Add a Mind Reader section to How to Play with a short worked example.
- Optional: keep a local list of revealed "beat the game" players to help pick future questions
  and data fixes (never sent anywhere).
- Tests: stats recording, share text on win and loss, storage failure fallback, the App switching
  modes.
- **Done when:** stats update correctly, sharing works on mobile and desktop, and all tests and
  lint pass.

#### Phase 13 — Tuning and docs
- Play-test with real users: adjust thresholds, question wording, the contradiction factor and the
  guess threshold. Re-run the simulation test after each change.
- Re-check Lighthouse (≥ 90 on Performance, Accessibility, Best Practices on mobile).
- Move Mind Reader from this section into Sections 2, 6, 7 and 8 as current design.
- **Done when:** the simulation targets hold and the docs describe both modes.

---

## 10. Future ideas

- A daily challenge alongside endless mode (same player for everyone each day).
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
