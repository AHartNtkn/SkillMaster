import { assembleMixedQuiz, QuestionPool } from './mixedQuiz'
import { MasteryEntry } from './updateMastery'
import { XpLog } from './awardXp'
import { describe, it, expect } from 'vitest'

function entry(status: 'unseen' | 'in_progress' | 'mastered', due: string, idx = 0): MasteryEntry {
  return { status, s: 0, d: 0, r: 0, l: 0, next_due: due, next_q_index: idx }
}

const pools: Record<string, QuestionPool> = {
  A: { pool: ['a1', 'a2', 'a3'] },
  B: { pool: ['b1', 'b2'] },
  C: { pool: ['c1'] },
}

const xp: XpLog = {
  format: 'XP-v1',
  log: [
    { id: 1, ts: '2025-01-10T00:00:00Z', delta: 10, source: 'A_q1' },
    { id: 2, ts: '2025-01-10T00:05:00Z', delta: 10, source: 'B_q1' },
    { id: 3, ts: '2024-12-01T00:00:00Z', delta: 10, source: 'C_q1' },
  ],
}

const now = new Date('2025-01-30T00:00:00Z')

describe('assembleMixedQuiz', () => {
  it('filters by mastery status and last attempt', () => {
    const mastery: Record<string, MasteryEntry> = {
      A: entry('mastered', '2025-01-20T00:00:00Z'),
      B: entry('in_progress', '2025-01-20T00:00:00Z'),
      C: entry('mastered', '2024-12-20T00:00:00Z'),
    }
    const quiz = assembleMixedQuiz(mastery, pools, xp, 5, now)
    expect(quiz.every(q => q.asId === 'A')).toBe(true)
  })

  it('cycles question indices by weight', () => {
    const mastery: Record<string, MasteryEntry> = {
      A: entry('mastered', '2025-01-28T00:00:00Z', 0), // overdue 2 -> weight 2
      B: entry('mastered', '2025-01-29T00:00:00Z', 1), // overdue 1 -> weight 1
    }
    const quiz = assembleMixedQuiz(mastery, pools, xp, 3, now)
    expect(quiz).toEqual([
      { asId: 'A', qIndex: 0 },
      { asId: 'B', qIndex: 1 },
      { asId: 'A', qIndex: 1 },
    ])
  })
})
