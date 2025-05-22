import { describe, it, expect } from 'vitest'
import { runScheduler, getQueue } from './schedule'
import { MasteryEntry } from './updateMastery'
import { Prefs, XpLog } from './awardXp'
import { DistMatrix, SkillMeta } from './scheduler'

describe('schedule module', () => {
  it('populates queue', () => {
    const skills: Record<string, SkillMeta> = { A: { id: 'A', topic: 'T1' } }
    const mastery: Record<string, MasteryEntry> = {
      A: {
        status: 'in_progress', s: 0, d: 0, r: 0, l: 0,
        next_due: '2025-01-01T00:00:00Z', next_q_index: 0
      }
    }
    const prefs: Prefs = { format: 'Prefs-v2', profile: 'save', xp_since_mixed_quiz: 0, last_as: null, ui_theme: 'default' }
    const xp: XpLog = { format: 'XP-v1', log: [] }
    const dist: DistMatrix = {}
    runScheduler(skills, mastery, prefs, xp, dist, new Date('2025-01-02T00:00:00Z'))
    const q = getQueue()
    expect(q.length).toBe(1)
    expect(q[0].id).toBe('A')
  })
})
