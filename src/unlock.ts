export interface SkillData {
  id: string
  name: string
  prereqs?: string[]
  weights?: Record<string, number>
}

export interface MasteryEntry {
  status: 'unseen' | 'in_progress' | 'mastered'
  // other fields ignored
}

/**
 * Return true if all prerequisites for this skill are mastered.
 */
export function prerequisitesMastered(
  skill: SkillData,
  mastery: Record<string, MasteryEntry | undefined>
): boolean {
  if (!skill.prereqs || skill.prereqs.length === 0) return true
  return skill.prereqs.every((id) => mastery[id]?.status === 'mastered')
}
