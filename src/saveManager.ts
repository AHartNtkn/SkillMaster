import path from 'path'
import { promises as fs } from 'fs'
import { atomicWriteFile, readJsonWithRecovery } from './persistence'
import { Prefs, XpLog } from './awardXp'

export interface MasteryFile {
  format: string
  ass: Record<string, unknown>
  topics: Record<string, any>
}

export interface AttemptsFile {
  format: string
  ass: Record<string, unknown>
  topics: Record<string, unknown>
}

export interface SaveState {
  mastery: MasteryFile
  attempts: AttemptsFile
  xp: XpLog
  prefs: Prefs
}

export class SaveManager implements SaveState {
  mastery!: MasteryFile
  attempts!: AttemptsFile
  xp!: XpLog
  prefs!: Prefs

  constructor(public dir: string) {}

  async load() {
    this.mastery = await readJsonWithRecovery<MasteryFile>(path.join(this.dir, 'mastery.json'))
    this.attempts = await readJsonWithRecovery<AttemptsFile>(path.join(this.dir, 'attempt_window.json'))
    this.xp = await readJsonWithRecovery<XpLog>(path.join(this.dir, 'xp.json'))
    this.prefs = await readJsonWithRecovery<Prefs>(path.join(this.dir, 'prefs.json'))
  }

  async autosave() {
    await fs.mkdir(this.dir, { recursive: true })
    await Promise.all([
      atomicWriteFile(path.join(this.dir, 'mastery.json'), JSON.stringify(this.mastery, null, 2)),
      atomicWriteFile(path.join(this.dir, 'attempt_window.json'), JSON.stringify(this.attempts, null, 2)),
      atomicWriteFile(path.join(this.dir, 'xp.json'), JSON.stringify(this.xp, null, 2)),
      atomicWriteFile(path.join(this.dir, 'prefs.json'), JSON.stringify(this.prefs, null, 2)),
    ])
  }
}

