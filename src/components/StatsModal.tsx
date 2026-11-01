import type { Stats } from '../types'
import { Modal } from './Modal'
import { StatsPanel } from './StatsPanel'

interface Props {
  open: boolean
  onClose: () => void
  stats: Stats
  puzzleNumber: number
  highlightGuesses?: number
}

export function StatsModal({ open, onClose, stats, puzzleNumber, highlightGuesses }: Props) {
  return (
    <Modal title="Statistics" open={open} onClose={onClose}>
      <StatsPanel stats={stats} puzzleNumber={puzzleNumber} highlightGuesses={highlightGuesses} />
      <p className="mt-4 text-xs text-gray-600 dark:text-gray-400">
        Stats are saved in this browser only.
      </p>
    </Modal>
  )
}
