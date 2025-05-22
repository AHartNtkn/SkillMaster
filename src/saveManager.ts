import path from 'path'
import { promises as fs } from 'fs'
import { atomicWriteFile } from './persistence'
import { loadWithMigrations } from './migrations'
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

export interface SaveManagerOptions {
  toast?: (msg: string) => void
  initialDelayMs?: number
  maxDelayMs?: number
}

export class SaveManager implements SaveState {
  mastery!: MasteryFile
  attempts!: AttemptsFile
  xp!: XpLog
  prefs!: Prefs

  private consecutiveFails = 0
  private options: SaveManagerOptions

  constructor(public dir: string, options: SaveManagerOptions = {}) {
    this.options = options
  }

  async load() {
    this.mastery = await loadWithMigrations<MasteryFile>(path.join(this.dir, 'mastery.json'), 'Mastery-v2')
    this.attempts = await loadWithMigrations<AttemptsFile>(path.join(this.dir, 'attempt_window.json'), 'Attempts-v1')
    this.xp = await loadWithMigrations<XpLog>(path.join(this.dir, 'xp.json'), 'XP-v1')
    this.prefs = await loadWithMigrations<Prefs>(path.join(this.dir, 'prefs.json'), 'Prefs-v1')
  }

  private async writeAll() {
    await fs.mkdir(this.dir, { recursive: true })
    await Promise.all([
      atomicWriteFile(path.join(this.dir, 'mastery.json'), JSON.stringify(this.mastery, null, 2)),
      atomicWriteFile(path.join(this.dir, 'attempt_window.json'), JSON.stringify(this.attempts, null, 2)),
      atomicWriteFile(path.join(this.dir, 'xp.json'), JSON.stringify(this.xp, null, 2)),
      atomicWriteFile(path.join(this.dir, 'prefs.json'), JSON.stringify(this.prefs, null, 2)),
    ])
  }

  async autosave() {
    let delay = this.options.initialDelayMs ?? 100
    const maxDelay = this.options.maxDelayMs ?? 32000
    while (true) {
      try {
        await this.writeAll()
        this.consecutiveFails = 0
        return
      } catch (err) {
        this.consecutiveFails++
        if (this.consecutiveFails >= 3 && this.options.toast) {
          this.options.toast('Autosave failed')
        }
        await new Promise((res) => setTimeout(res, delay))
        delay = Math.min(delay * 2, maxDelay)
      }
    }
  }
}

