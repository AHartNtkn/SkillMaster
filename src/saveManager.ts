import path from 'path'
import { promises as fs, watchFile, unwatchFile, Stats } from 'fs'
import { atomicWriteFile } from './persistence'
import { logError } from './logger'
import { openFolder } from './backend'
import { loadWithMigrations } from './migrations'
import { Prefs, XpLog } from './awardXp'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { tmpdir } from 'os'

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

import { ToastAction } from './Toast'

export interface SaveManagerOptions {
  toast?: (msg: string, actions?: ToastAction[]) => void
  initialDelayMs?: number
  maxDelayMs?: number
}

export class SaveManager implements SaveState {
  mastery!: MasteryFile
  attempts!: AttemptsFile
  xp!: XpLog
  prefs!: Prefs

  private watchers: Array<{ file: string; handler: (curr: Stats, prev: Stats) => void }> = []

  private consecutiveFails = 0
  private options: SaveManagerOptions

  constructor(public dir: string, options: SaveManagerOptions = {}) {
    this.options = options
  }

  watch(interval = 1000) {
    this.unwatch()
    const watchFileHelper = async (
      name: string,
      assign: (data: any) => void,
    ) => {
      const file = path.join(this.dir, name)
      const handler = async (curr: Stats, prev: Stats) => {
        if (curr.mtimeMs === prev.mtimeMs) return
        assign(JSON.parse(await fs.readFile(file, 'utf8')))
      }
      watchFile(file, { persistent: false, interval }, handler)
      this.watchers.push({ file, handler })
    }
    watchFileHelper('mastery.json', (d) => (this.mastery = d))
    watchFileHelper('attempt_window.json', (d) => (this.attempts = d))
    watchFileHelper('xp.json', (d) => (this.xp = d))
    watchFileHelper('prefs.json', (d) => (this.prefs = d))
  }

  unwatch() {
    for (const w of this.watchers) {
      unwatchFile(w.file, w.handler)
    }
    this.watchers = []
  }

  private seedBlank() {
    this.mastery = { format: 'Mastery-v2', ass: {}, topics: {} }
    this.attempts = { format: 'Attempts-v1', ass: {}, topics: {} }
    this.xp = { format: 'XP-v1', log: [] }
    this.prefs = {
      format: 'Prefs-v2',
      profile: path.basename(this.dir),
      xp_since_mixed_quiz: 0,
      last_as: null,
      ui_theme: 'default'
    }
  }

  private static execFile = promisify(execFile)

  private static versionGt(a: string, b: string): boolean {
    const get = (v: string) => {
      const m = v.match(/v(\d+)/)
      return m ? parseInt(m[1]) : 0
    }
    return get(a) > get(b)
  }

  async load() {
    this.mastery = await loadWithMigrations<MasteryFile>(path.join(this.dir, 'mastery.json'), 'Mastery-v2')
    this.attempts = await loadWithMigrations<AttemptsFile>(path.join(this.dir, 'attempt_window.json'), 'Attempts-v1')
    this.xp = await loadWithMigrations<XpLog>(path.join(this.dir, 'xp.json'), 'XP-v1')
    this.prefs = await loadWithMigrations<Prefs>(path.join(this.dir, 'prefs.json'), 'Prefs-v2')
    this.watch()
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
        await logError(String(err))
        this.consecutiveFails++
        if (this.consecutiveFails >= 3 && this.options.toast) {
          this.options.toast('Autosave failed', [
            { label: 'Retry', onClick: () => this.autosave() },
            { label: 'Open Folder', onClick: () => openFolder(this.dir) }
          ])
        }
        await new Promise((res) => setTimeout(res, delay))
        delay = Math.min(delay * 2, maxDelay)
      }
    }
  }

  async exportProgress(outFile: string) {
    await SaveManager.execFile('zip', [
      '-q',
      '-j',
      outFile,
      'mastery.json',
      'attempt_window.json',
      'xp.json',
      'prefs.json',
    ], { cwd: this.dir })
  }

  async importProgress(zipFile: string) {
    this.unwatch()
    const tmp = await fs.mkdtemp(path.join(tmpdir(), 'import-'))
    await SaveManager.execFile('unzip', ['-qq', zipFile, '-d', tmp])

    const files = {
      mastery: 'Mastery-v2',
      attempt_window: 'Attempts-v1',
      xp: 'XP-v1',
      prefs: 'Prefs-v2',
    }

    for (const [name, fmt] of Object.entries(files)) {
      const p = path.join(tmp, `${name}.json`)
      const data = JSON.parse(await fs.readFile(p, 'utf8'))
      if (SaveManager.versionGt(data.format, fmt)) {
        throw new Error('Unsupported format')
      }
    }

    await fs.mkdir(this.dir, { recursive: true })
    for (const name of Object.keys(files)) {
      await fs.copyFile(path.join(tmp, `${name}.json`), path.join(this.dir, `${name}.json`))
    }
    this.watch()
  }

  async resetProfile() {
    this.unwatch()
    const ts = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)
    const archiveRoot = path.join(path.dirname(this.dir), 'archive')
    await fs.mkdir(archiveRoot, { recursive: true })
    const dest = path.join(archiveRoot, ts)
    if (await fs.stat(this.dir).catch(() => false)) {
      await fs.rename(this.dir, dest)
    }
    await fs.mkdir(this.dir, { recursive: true })
    this.seedBlank()
    await this.writeAll()
    this.watch()
  }
}

