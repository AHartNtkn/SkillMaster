export interface MasteryEntry {
  status: 'unseen' | 'in_progress' | 'mastered'
  s: number
  d: number
  r: number
  l: number
  next_due: string
  next_q_index: number
}

export interface SkillMeta {
  id: string
  name: string
  prereqs?: string[]
  weights?: Record<string, number>
}

import { nextReview } from './fsrs'
import { advanceIdx } from './advanceIdx'

const ALPHA_IMPLICIT = 0.3

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400_000)
}

function toCard(entry: MasteryEntry) {
  return {
    due: new Date(entry.next_due),
    stability: entry.s,
    difficulty: entry.d,
    reps: entry.r,
    lapses: entry.l,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
    state: 0
  }
}

/**
 * Update mastery state for an answered skill and apply implicit
 * prerequisite credit when grade \u2265 4.
 * Mutates the mastery record in place.
 */
export function updateMastery(
  mastery: Record<string, MasteryEntry>,
  skill: SkillMeta,
  grade: number,
  totalQuestions: number,
  now: Date = new Date()
): void {
  const entry = mastery[skill.id]
  if (!entry) return

  const card = toCard(entry)
  const next = nextReview(card, grade)

  mastery[skill.id] = {
    status: 'in_progress',
    s: next.stability,
    d: next.difficulty,
    r: next.reps,
    l: next.lapses,
    next_due: next.due.toISOString(),
    next_q_index: advanceIdx(entry.next_q_index, totalQuestions)
  }

  if (grade >= 4 && skill.prereqs) {
    for (const p of skill.prereqs) {
      const m = mastery[p]
      if (!m) continue
      const weight = skill.weights?.[p] ?? 1
      const pNext = nextReview(toCard(m), 4)
      const interval = pNext.scheduled_days
      const damp = Math.max(1, Math.round(ALPHA_IMPLICIT * weight * interval))
      mastery[p] = {
        status: m.status,
        s: pNext.stability,
        d: pNext.difficulty,
        r: pNext.reps,
        l: pNext.lapses,
        next_due: addDays(now, damp).toISOString(),
        next_q_index: m.next_q_index
      }
    }
  }
}
