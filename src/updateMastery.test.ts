import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateMastery, MasteryEntry, SkillMeta } from './updateMastery'
import * as fsrsMod from './fsrs'

function makeEntry(): MasteryEntry {
  return {
    status: 'unseen',
    s: 0,
    d: 0,
    r: 0,
    l: 0,
    next_due: '2025-01-01T00:00:00.000Z',
    next_q_index: 0
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('updateMastery', () => {
  it('updates main skill and increments question index', () => {
    const mastery: Record<string, MasteryEntry> = { A: makeEntry() }
    const skill: SkillMeta = { id: 'A', name: 'A' }

    vi.spyOn(fsrsMod, 'nextReview').mockReturnValue({
      stability: 0.5,
      difficulty: 0.4,
      reps: 1,
      lapses: 0,
      due: new Date('2025-01-02T00:00:00Z'),
      scheduled_days: 1
    } as any)

    updateMastery(mastery, skill, 5, 5, new Date('2025-01-01T00:00:00Z'))

    expect(mastery.A.s).toBe(0.5)
    expect(mastery.A.next_q_index).toBe(1)
    expect(mastery.A.next_due).toBe('2025-01-02T00:00:00.000Z')
  })

  it('applies implicit credit to prerequisites when grade>=4', () => {
    const mastery: Record<string, MasteryEntry> = {
      A: makeEntry(),
      P: makeEntry()
    }
    const skill: SkillMeta = { id: 'A', name: 'A', prereqs: ['P'], weights: { P: 0.5 } }

    const mainNext = {
      stability: 0.5,
      difficulty: 0.4,
      reps: 1,
      lapses: 0,
      due: new Date('2025-01-02T00:00:00Z'),
      scheduled_days: 1
    }
    const prereqNext = {
      stability: 0.9,
      difficulty: 0.8,
      reps: 2,
      lapses: 0,
      due: new Date('2025-01-02T00:00:00Z'),
      scheduled_days: 4
    }
    const spy = vi.spyOn(fsrsMod, 'nextReview')
    spy.mockReturnValueOnce(mainNext as any).mockReturnValueOnce(prereqNext as any)

    updateMastery(mastery, skill, 5, 5, new Date('2025-01-01T00:00:00Z'))

    // main updated
    expect(mastery.A.s).toBe(0.5)
    // prereq interval damped: 0.3 * 0.5 * 4 = 0.6 -> round ->1
    expect(mastery.P.next_due).toBe('2025-01-02T00:00:00.000Z')
    expect(mastery.P.s).toBe(0.9)
  })

  it('skips implicit credit when grade<4', () => {
    const mastery: Record<string, MasteryEntry> = {
      A: makeEntry(),
      P: makeEntry()
    }
    const skill: SkillMeta = { id: 'A', name: 'A', prereqs: ['P'] }

    vi.spyOn(fsrsMod, 'nextReview').mockReturnValue({
      stability: 0.5,
      difficulty: 0.4,
      reps: 1,
      lapses: 0,
      due: new Date('2025-01-02T00:00:00Z'),
      scheduled_days: 2
    } as any)

    updateMastery(mastery, skill, 3, 5, new Date('2025-01-01T00:00:00Z'))

    expect(mastery.P.next_due).toBe('2025-01-01T00:00:00.000Z')
  })
})
