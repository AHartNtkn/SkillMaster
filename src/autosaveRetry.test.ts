import { SaveManager } from './saveManager'
import { promises as fs } from 'fs'
import path from 'path'
import { tmpdir } from 'os'
import { describe, it, expect, vi } from 'vitest'
import * as persistence from './persistence'

function sampleState() {
  return {
    mastery: { format: 'Mastery-v2', ass: {}, topics: {} },
    attempts: { format: 'Attempts-v1', ass: {}, topics: {} },
    xp: { format: 'XP-v1', log: [] },
    prefs: { xp_since_mixed_quiz: 0, last_as: null, ui_theme: 'default' }
  }
}

describe('autosave retries', () => {
  it('shows toast after three consecutive failures', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'save-'))
    const state = sampleState()
    await fs.writeFile(path.join(dir, 'mastery.json'), JSON.stringify(state.mastery))
    await fs.writeFile(path.join(dir, 'attempt_window.json'), JSON.stringify(state.attempts))
    await fs.writeFile(path.join(dir, 'xp.json'), JSON.stringify(state.xp))
    await fs.writeFile(path.join(dir, 'prefs.json'), JSON.stringify(state.prefs))

    const toast = vi.fn()
    const manager = new SaveManager(dir, { toast, initialDelayMs: 1, maxDelayMs: 1 })
    await manager.load()

    let calls = 0
    vi.spyOn(persistence, 'atomicWriteFile').mockImplementation(async () => {
      calls++
      if (calls <= 12) throw new Error('fail')
    })

    await manager.autosave()

    expect(calls).toBe(16)
    expect(toast).toHaveBeenCalledTimes(1)
  })
})
