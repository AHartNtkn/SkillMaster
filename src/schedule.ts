import { Candidate, generateCandidates, DistMatrix, SkillMeta } from './scheduler'
import { MasteryEntry } from './updateMastery'
import { Prefs, XpLog } from './awardXp'

interface ScheduleState {
  queue: Candidate[]
}

const state: ScheduleState = { queue: [] }

export function getQueue(): Candidate[] {
  return state.queue
}

export function popTask(): Candidate | undefined {
  return state.queue.shift()
}

export function setQueue(q: Candidate[]): void {
  state.queue = q
}

export function runScheduler(
  skills: Record<string, SkillMeta>,
  mastery: Record<string, MasteryEntry>,
  prefs: Prefs,
  xp: XpLog,
  dist: DistMatrix,
  now: Date = new Date(),
): void {
  state.queue = generateCandidates(skills, mastery, prefs, xp, dist, now)
}
