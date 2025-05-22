import { prerequisitesMastered } from './unlock'
import { Prefs, XpLog } from './awardXp'
import { MasteryEntry } from './updateMastery'

export interface SkillMeta {
  id: string
  topic: string
  prereqs?: string[]
}

export interface DistMatrix {
  [src: string]: Record<string, number>
}

export interface Candidate {
  id: string
  kind: 'review' | 'new_as' | 'mixed_quiz'
  priority: number
}

const REVIEW_GAP_MIN_M = 10
const MIXED_QUIZ_TRIGGER_XP = 150

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86400_000)
}

function distanceBonus(last: string | null, target: string, dist: DistMatrix): number {
  if (!last) return 5
  const d = dist[last]?.[target]
  if (d === undefined) return 5
  return Math.min(5, d)
}

function lastAttemptTime(asId: string, xp: XpLog): Date | undefined {
  for (let i = xp.log.length - 1; i >= 0; i--) {
    const entry = xp.log[i]
    if (entry.source.startsWith(asId)) {
      return new Date(entry.ts)
    }
  }
}

function shouldRejectForGap(
  skills: Record<string, SkillMeta>,
  candidate: SkillMeta,
  prefs: Prefs,
  xp: XpLog,
  now: Date,
): boolean {
  const lastId = prefs.last_as
  if (!lastId) return false
  const lastSkill = skills[lastId]
  if (!lastSkill) return false
  if (lastSkill.topic !== candidate.topic) return false
  const lastTime = lastAttemptTime(lastId, xp)
  if (!lastTime) return false
  return (now.getTime() - lastTime.getTime()) / 60000 < REVIEW_GAP_MIN_M
}

export function generateCandidates(
  skills: Record<string, SkillMeta>,
  mastery: Record<string, MasteryEntry>,
  prefs: Prefs,
  xp: XpLog,
  dist: DistMatrix,
  now: Date = new Date(),
): Candidate[] {
  const list: Candidate[] = []
  const seen = new Set<string>()

  const add = (c: Candidate) => {
    if (!seen.has(c.id)) {
      seen.add(c.id)
      list.push(c)
    }
  }

  const courseOf = (id: string): string => id.split(':')[0]

  for (const skill of Object.values(skills)) {
    const m = mastery[skill.id]
    if (!m) continue
    if (shouldRejectForGap(skills, skill, prefs, xp, now)) continue

    const due = new Date(m.next_due)
    const overdueDays = daysBetween(now, due)
    if (m.status !== 'unseen' && overdueDays >= 0) {
      const overdueBonus = Math.min(Math.max(overdueDays, 0), 5)
      const overduePrereqs = skill.prereqs?.filter(p => {
        const pm = mastery[p]
        return pm && pm.status !== 'unseen' && new Date(pm.next_due) <= now
      }).length ?? 0
      const priority =
        5 +
        overdueBonus +
        3 * overduePrereqs +
        distanceBonus(prefs.last_as, skill.id, dist)
      add({ id: skill.id, kind: 'review', priority })
    } else if (m.status === 'unseen' && prerequisitesMastered(skill, mastery)) {
      const priority =
        3 +
        0 +
        0 +
        distanceBonus(prefs.last_as, skill.id, dist)
      add({ id: skill.id, kind: 'new_as', priority })
    }

    if (skill.prereqs) {
      for (const p of skill.prereqs) {
        if (courseOf(p) !== courseOf(skill.id)) {
          const pm = mastery[p]
          if (!pm) continue
          const dueP = new Date(pm.next_due)
          const overdueDaysP = daysBetween(now, dueP)
          if (pm.status !== 'unseen' && overdueDaysP >= 0) {
            const overdueBonusP = Math.min(Math.max(overdueDaysP, 0), 5)
            const priorityP =
              5 + overdueBonusP + distanceBonus(prefs.last_as, p, dist)
            add({ id: p, kind: 'review', priority: priorityP })
          }
        }
      }
    }
  }
  if (prefs.xp_since_mixed_quiz >= MIXED_QUIZ_TRIGGER_XP) {
    add({ id: 'mixed_quiz', kind: 'mixed_quiz', priority: 2 })
  }
  return list.sort((a, b) => b.priority - a.priority)
}
