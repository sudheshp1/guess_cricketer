import {
  Activity,
  CalendarDays,
  Globe,
  Hand,
  Layers,
  Target,
  TrendingUp,
  Trophy,
  Type,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import type { ClueKey } from '../types'

/** One icon per clue type, shared by the clue cards and How to play. */
export const CLUE_ICONS: Record<ClueKey, LucideIcon> = {
  role: UserRound,
  country: Globe,
  style: Hand,
  debut: CalendarDays,
  status: Activity,
  matches: Layers,
  batting: TrendingUp,
  bowling: Target,
  milestones: Trophy,
  initials: Type,
}
