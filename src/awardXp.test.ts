import { awardXp, XpLog, Prefs } from './awardXp'
import { describe, it, expect } from 'vitest'

function makeState(): { xp: XpLog; prefs: Prefs } {
  return {
    xp: { format: 'XP-v1', log: [] },
    prefs: { format: 'Prefs-v2', profile: 'save', xp_since_mixed_quiz: 0, last_as: null, ui_theme: 'default' }
  }
}

describe('awardXp', () => {
  it('appends xp entry and increments counter', () => {
    const { xp, prefs } = makeState()
    const now = new Date('2025-01-01T00:00:00Z')
    awardXp(xp, prefs, 10, 'EA001_q1', now)
    expect(xp.log.length).toBe(1)
    expect(xp.log[0]).toEqual({ id: 1, ts: now.toISOString(), delta: 10, source: 'EA001_q1' })
    expect(prefs.xp_since_mixed_quiz).toBe(10)
  })

  it('increments id for subsequent awards', () => {
    const { xp, prefs } = makeState()
    awardXp(xp, prefs, 10, 'EA001_q1', new Date('2025-01-01T00:00:00Z'))
    awardXp(xp, prefs, 20, 'EA001_q2', new Date('2025-01-01T00:05:00Z'))
    expect(xp.log[1].id).toBe(2)
    expect(prefs.xp_since_mixed_quiz).toBe(30)
  })
})

