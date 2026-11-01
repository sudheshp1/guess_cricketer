# Cricdle

An endless cricket guessing game. Each round picks a mystery international cricketer and shows one
clue; every wrong guess reveals the next, more specific clue (role, country, style, debut, status,
matches, runs, wickets, milestones, name shape). Solve it in as few of the 10 clues as you can,
then play the next player.

## Development

```sh
npm install
npm run dev      # start the dev server
npm test         # run unit tests
npm run lint     # oxlint + prettier check
npm run data     # rebuild + validate players.json (offline)
npm run data:fetch  # refresh Wikipedia/Cricsheet snapshots (network)
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
3. `npm run data` (offline) merges seed + snapshots into `players.json`, validates it,
   and writes `scripts/sources/report.md` listing every source disagreement.

Rules: match counts per format use the larger of Wikipedia and Cricsheet (Wikipedia can lag;
Cricsheet only ever misses matches, and holds none involving Afghanistan's men). Debut year is the
earliest international debut in the infobox. "Active" means Wikipedia's international span ends in
"present".

Match data from [Cricsheet](https://cricsheet.org) (ODC-By). Not affiliated with any cricket board
or league.

Current data: 508 players from 14 teams, with per-format career figures (runs, highest score,
100s/50s, wickets, best bowling) from Wikipedia infoboxes. `scripts/sources/report.md` lists every
source disagreement and every manual override.

## Deploying

The site is a static Vite build (`dist/`). `vercel.json` configures Vercel, including long-lived
caching for hashed assets.

```sh
npx vercel --prod          # first run links the project, later runs redeploy
```

If the production domain is not `https://guess-cricketer.vercel.app`, set `VITE_SITE_URL` in
`.env` (used in share text and Open Graph tags) and redeploy.
