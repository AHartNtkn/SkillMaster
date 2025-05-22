export interface QuestionPool {
  pool: any[]
}

export interface MixedQuestion {
  asId: string
  qIndex: number
}

import { MasteryEntry } from './updateMastery'
import { XpLog } from './awardXp'
import { advanceIdx } from './advanceIdx'

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86400_000)
}

function lastAttemptTime(asId: string, xp: XpLog): Date | undefined {
  for (let i = xp.log.length - 1; i >= 0; i--) {
    const entry = xp.log[i]
    if (entry.source.startsWith(asId)) {
      return new Date(entry.ts)
    }
  }
}

export function assembleMixedQuiz(
  mastery: Record<string, MasteryEntry>,
  pools: Record<string, QuestionPool>,
  xp: XpLog,
  count = 15,
  now: Date = new Date()
): MixedQuestion[] {
  const eligible: { id: string; weight: number; idx: number; total: number }[] = []
  for (const [id, pool] of Object.entries(pools)) {
    const m = mastery[id]
    if (!m || m.status !== 'mastered') continue
    const last = lastAttemptTime(id, xp)
    if (!last || daysBetween(now, last) > 30) continue
    const overdue = daysBetween(now, new Date(m.next_due))
    const weight = Math.max(overdue, 0)
    if (weight <= 0) continue
    eligible.push({ id, weight, idx: m.next_q_index, total: pool.pool.length })
  }
  eligible.sort((a, b) => a.id.localeCompare(b.id))
  const result: MixedQuestion[] = []
  let remaining = true
  while (result.length < count && remaining) {
    remaining = false
    for (const e of eligible) {
      if (result.length >= count) break
      if (e.weight > 0) {
        result.push({ asId: e.id, qIndex: e.idx })
        e.idx = advanceIdx(e.idx, e.total)
        e.weight--
        remaining = true
      }
    }
  }
  return result
}
