import { useState } from 'react'
import type { GameMode, MindStats, Stats } from '../types'
import { MindStatsPanel } from './MindStatsPanel'
import { Modal } from './Modal'
import { StatsPanel } from './StatsPanel'

interface Props {
  open: boolean
  animate?: boolean
  onClose: () => void
  stats: Stats
  mindStats: MindStats
  /** Which tab shows first. */
  initialTab?: GameMode
  highlightClue?: number
  highlightQuestions?: number
}

const TABS: { value: GameMode; label: string }[] = [
  { value: 'clues', label: 'Guess the player' },
  { value: 'mind', label: 'Mind Reader' },
]

export function StatsModal({
  open,
  animate,
  onClose,
  stats,
  mindStats,
  initialTab = 'clues',
  highlightClue,
  highlightQuestions,
}: Props) {
  const [tab, setTab] = useState<GameMode>(initialTab)
  return (
    <Modal title="Statistics" open={open} onClose={onClose} animate={animate}>
      <div
        role="tablist"
        aria-label="Game mode"
        className="mb-4 flex gap-1 rounded-full bg-surface-2 p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            id={`stats-tab-${t.value}`}
            aria-selected={tab === t.value}
            aria-controls="stats-tabpanel"
            onClick={() => setTab(t.value)}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold focus-visible:outline-3 focus-visible:outline-gold-fill ${
              tab === t.value
                ? 'bg-surface text-ink shadow-(--shadow)'
                : 'text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="stats-tabpanel" aria-labelledby={`stats-tab-${tab}`}>
        {tab === 'clues' ? (
          <>
            <StatsPanel stats={stats} highlightClue={highlightClue} />
            <p className="mt-4 text-xs text-muted">
              Stats are saved in this browser only. A streak counts rounds won in a row.
            </p>
          </>
        ) : (
          <>
            <MindStatsPanel stats={mindStats} highlightQuestions={highlightQuestions} />
            <p className="mt-4 text-xs text-muted">Stats are saved in this browser only.</p>
          </>
        )}
      </div>
    </Modal>
  )
}
