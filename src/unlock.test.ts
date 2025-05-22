import { describe, it, expect } from 'vitest'
import { prerequisitesMastered, SkillData, MasteryEntry } from './unlock'

describe('prerequisitesMastered', () => {
  const mastery: Record<string, MasteryEntry> = {
    s1: { status: 'mastered' },
    s2: { status: 'mastered' },
    s3: { status: 'in_progress' },
  }

  it('returns true when no prereqs', () => {
    const skill: SkillData = { id: 'A', name: 'A' }
    expect(prerequisitesMastered(skill, mastery)).toBe(true)
  })

  it('returns true when all prereqs mastered', () => {
    const skill: SkillData = { id: 'B', name: 'B', prereqs: ['s1', 's2'] }
    expect(prerequisitesMastered(skill, mastery)).toBe(true)
  })

  it('returns false when any prereq not mastered', () => {
    const skill: SkillData = { id: 'C', name: 'C', prereqs: ['s1', 's3'] }
    expect(prerequisitesMastered(skill, mastery)).toBe(false)
  })

  it('returns false when mastery entry missing', () => {
    const skill: SkillData = { id: 'D', name: 'D', prereqs: ['s1', 's4'] }
    expect(prerequisitesMastered(skill, mastery)).toBe(false)
  })
})
