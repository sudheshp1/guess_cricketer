# Cricdle

A daily cricket guessing game. Everyone gets the same mystery cricketer each day (rolls over at
00:00 IST). You have 8 guesses; after each one, the game colour-codes how close you are on country,
role, batting hand, bowling type, debut year, international matches, and active status.

## Development

```sh
npm install
npm run dev      # start the dev server
npm test         # run unit tests
npm run lint     # oxlint + prettier check
npm run data     # rebuild + validate players.json and schedule.json
npm run build    # production build into dist/
```

See `CLAUDE.md` for the full spec.

## Player data

`src/data/players.json` is generated, never hand-edited:

1. `scripts/players-seed.csv` lists each player (id, display name, Wikipedia title, aliases,
   difficulty). Leave attribute columns blank to take them from sources; fill one only to
   override, and explain why in `notes`. Put doubts in `todo_verify`.
2. `npm run data:fetch` (network) snapshots each player's Wikipedia infobox, plus the T20I list
   page when the infobox has no T20I column, and Cricsheet match counts, into
   `scripts/sources/`. These snapshots are committed.
3. `npm run data` (offline) merges seed + snapshots into `players.json`, validates it, builds
   `schedule.json`, and writes `scripts/sources/report.md` listing every source disagreement.

Rules: match counts per format use the larger of Wikipedia and Cricsheet (Wikipedia can lag;
Cricsheet only ever misses matches, and holds none involving Afghanistan's men). Debut year is the
earliest international debut in the infobox. "Active" means Wikipedia's international span ends in
"present".

Match data from [Cricsheet](https://cricsheet.org) (ODC-By). Not affiliated with any cricket board
or league.
