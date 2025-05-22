import { SaveManager } from './saveManager'
import { awardXpAndSave } from './awardXp'
import { promises as fs } from 'fs'
import path from 'path'
import { tmpdir } from 'os'
import { describe, it, expect, vi } from 'vitest'

function sampleState() {
  return {
    mastery: { format: 'Mastery-v2', ass: {}, topics: {} },
    attempts: { format: 'Attempts-v1', ass: {}, topics: {} },
    xp: { format: 'XP-v1', log: [] },
    prefs: { format: 'Prefs-v2', profile: 'save', xp_since_mixed_quiz: 0, last_as: null, ui_theme: 'default' }
  }
}

describe('SaveManager', () => {
  it('loads and autosaves state', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'save-'))
    const state = sampleState()
    await fs.writeFile(path.join(dir, 'mastery.json'), JSON.stringify(state.mastery))
    await fs.writeFile(path.join(dir, 'attempt_window.json'), JSON.stringify(state.attempts))
    await fs.writeFile(path.join(dir, 'xp.json'), JSON.stringify(state.xp))
    await fs.writeFile(path.join(dir, 'prefs.json'), JSON.stringify(state.prefs))

    const manager = new SaveManager(dir)
    await manager.load()
    await awardXpAndSave(manager, 5, 'test', new Date('2025-01-01T00:00:00Z'))

    const files = (await fs.readdir(dir)).sort()
    expect(files).toEqual(['attempt_window.json', 'mastery.json', 'prefs.json', 'xp.json'])
    const xp = JSON.parse(await fs.readFile(path.join(dir, 'xp.json'), 'utf8'))
    expect(xp.log.length).toBe(1)
    expect(xp.log[0].delta).toBe(5)
  })

  it('migrates older prefs file', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'save-'))
    const state = sampleState()
    await fs.writeFile(path.join(dir, 'mastery.json'), JSON.stringify(state.mastery))
    await fs.writeFile(path.join(dir, 'attempt_window.json'), JSON.stringify(state.attempts))
    await fs.writeFile(path.join(dir, 'xp.json'), JSON.stringify(state.xp))
    const oldPrefs = { format: 'Prefs-v0', xp_since_mixed_quiz: 0, last_as: null }
    await fs.writeFile(path.join(dir, 'prefs.json'), JSON.stringify(oldPrefs))

    const manager = new SaveManager(dir)
    const now = new Date('2025-01-01T00:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(now)
    await manager.load()
    vi.useRealTimers()

    expect(manager.prefs).toEqual({ format: 'Prefs-v2', profile: 'save', xp_since_mixed_quiz: 0, last_as: null, ui_theme: 'default' })
    const backupDir = path.join(dir, 'backup_20250101')
    const backups = await fs.readdir(backupDir)
    expect(backups).toContain('prefs.json')
  })
})

