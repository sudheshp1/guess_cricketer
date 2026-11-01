import type { Stats } from '../types'
import { Modal } from './Modal'
import { StatsPanel } from './StatsPanel'

interface Props {
  open: boolean
  animate?: boolean
  onClose: () => void
  stats: Stats
  highlightClue?: number
}

export function StatsModal({ open, animate, onClose, stats, highlightClue }: Props) {
  return (
    <Modal title="Statistics" open={open} onClose={onClose} animate={animate}>
      <StatsPanel stats={stats} highlightClue={highlightClue} />
      <p className="mt-4 text-xs text-gray-600 dark:text-gray-400">
        Stats are saved in this browser only. A streak counts rounds won in a row.
      </p>
    </Modal>
  )
}
