/** Fails (exit 1) if src/data/players.json breaks any rule in CLAUDE.md section 3.3. */
import { PLAYERS_PATH, readJson } from './lib/sources.ts'
import { validatePlayers } from './lib/validate.ts'

const errors = validatePlayers(readJson<unknown>(PLAYERS_PATH))
if (errors.length > 0) {
  console.error(`players.json is invalid (${errors.length} problem(s)):\n  ${errors.join('\n  ')}`)
  process.exit(1)
}
console.log('players.json is valid')
