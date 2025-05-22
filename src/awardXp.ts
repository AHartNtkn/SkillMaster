export interface XpEntry {
  id: number
  ts: string
  delta: number
  source: string
}

export interface XpLog {
  format: 'XP-v1'
  log: XpEntry[]
}

export interface Prefs {
  xp_since_mixed_quiz: number
  last_as: string | null
  ui_theme: string
}

/**
 * Record an XP transaction and update prefs counters.
 * Mutates the provided objects.
 */
export function awardXp(xp: XpLog, prefs: Prefs, delta: number, source: string, ts: Date = new Date()): void {
  const nextId = xp.log.length > 0 ? xp.log[xp.log.length - 1].id + 1 : 1
  xp.log.push({ id: nextId, ts: ts.toISOString(), delta, source })
  prefs.xp_since_mixed_quiz += delta
}


import { SaveManager } from './saveManager'

/**
 * Award XP and immediately autosave via SaveManager.
 */
export async function awardXpAndSave(manager: SaveManager, delta: number, source: string, ts: Date = new Date()): Promise<void> {
  awardXp(manager.xp, manager.prefs, delta, source, ts)
  await manager.autosave()
}

