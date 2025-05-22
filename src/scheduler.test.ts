import { describe, it, expect } from 'vitest'
import { generateCandidates, DistMatrix, SkillMeta } from './scheduler'
import { MasteryEntry } from './updateMastery'
import { Prefs, XpLog } from './awardXp'

function entry(status: 'unseen' | 'in_progress' | 'mastered', due: string): MasteryEntry {
  return { status, s: 0, d: 0, r: 0, l: 0, next_due: due, next_q_index: 0 }
}

const skills: Record<string, SkillMeta> = {
  A: { id: "A", topic: "T0", prereqs: ["P"] },
  P: { id: 'P', topic: 'T0' }
}

const dist: DistMatrix = { P: { A: 2 } }

const xp: XpLog = { format: 'XP-v1', log: [{ id: 1, ts: '2025-01-10T00:00:00Z', delta: 10, source: 'P_q1' }] }

const prefs: Prefs = { format: 'Prefs-v2', profile: 'save', xp_since_mixed_quiz: 0, last_as: 'P', ui_theme: 'default' }

const now = new Date('2025-01-10T00:05:00Z')

describe('generateCandidates', () => {
  it('prioritizes overdue review with bonuses', () => {
    const mastery: Record<string, MasteryEntry> = {
      A: entry('in_progress', '2025-01-07T00:00:00Z'),
      P: entry('in_progress', '2025-01-08T00:00:00Z')
    }
    const cand = generateCandidates(skills, mastery, { ...prefs, last_as: "P" }, { format: "XP-v1", log: [{ id: 1, ts: "2025-01-09T23:40:00Z", delta: 10, source: "P_q1" }] }, dist, now)
    expect(cand[0]).toEqual({ id: 'A', kind: 'review', priority: 5 + 3 + 3 + 2 })
  })

  it('includes new skills when prereqs mastered', () => {
    const mastery: Record<string, MasteryEntry> = {
      A: entry('unseen', '2025-01-15T00:00:00Z'),
      P: entry('mastered', '2025-01-01T00:00:00Z')
    }
    const cand = generateCandidates(skills, mastery, { ...prefs, last_as: null }, xp, dist, now)
    expect(cand.some(c => c.id === "A" && c.kind === "new_as")).toBe(true)
  })

  it('omits candidate when non-interference gap not elapsed', () => {
    const mastery: Record<string, MasteryEntry> = {
      P: entry('in_progress', '2025-01-08T00:00:00Z'),
      A: entry('in_progress', '2025-01-07T00:00:00Z')
    }
    const recentXp: XpLog = { format: 'XP-v1', log: [{ id: 1, ts: '2025-01-10T00:04:00Z', delta: 10, source: 'P_q1' }] }
    const cand = generateCandidates(skills, mastery, { ...prefs, last_as: 'P' }, recentXp, dist, now)
    expect(cand.length).toBe(0)
  })

  it('adds mixed quiz when xp threshold met', () => {
    const mastery: Record<string, MasteryEntry> = {
      A: entry('unseen', '2025-01-15T00:00:00Z'),
      P: entry('mastered', '2025-01-01T00:00:00Z')
    }
    const cand = generateCandidates(skills, mastery, { ...prefs, xp_since_mixed_quiz: 200 }, xp, dist, now)
    const mq = cand.find(c => c.kind === 'mixed_quiz')
    expect(mq).toBeDefined()
  })

  it('includes overdue prerequisites from other courses', () => {
    const skills2: Record<string, SkillMeta> = {
      'C1:AS1': { id: 'C1:AS1', topic: 'C1:T1', prereqs: ['C2:AS1'] },
      'C2:AS1': { id: 'C2:AS1', topic: 'C2:T1' }
    }
    const dist2: DistMatrix = { 'C2:AS1': { 'C1:AS1': 1 } }
    const mastery: Record<string, MasteryEntry> = {
      'C1:AS1': entry('unseen', '2025-01-15T00:00:00Z'),
      'C2:AS1': entry('in_progress', '2025-01-07T00:00:00Z')
    }
    const cand = generateCandidates(skills2, mastery, { ...prefs, last_as: null }, xp, dist2, now)
    expect(cand.some(c => c.id === 'C2:AS1')).toBe(true)
  })
})
