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

Match data from [Cricsheet](https://cricsheet.org) (ODC-By). Not affiliated with any cricket board
or league.
