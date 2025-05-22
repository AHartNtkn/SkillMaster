import path from 'path'
import { promises as fs } from 'fs'
import { SaveManager } from './saveManager'
import type { AppStore, UserState } from './store'

export async function initSave(store: AppStore, rootDir = process.cwd()): Promise<SaveManager> {
  const prefsPath = path.join(rootDir, 'save', 'prefs.json')
  const prefs = JSON.parse(await fs.readFile(prefsPath, 'utf8'))
  const profileDir = path.join(rootDir, prefs.profile)
  const manager = new SaveManager(profileDir, {
    onChange: () => {
      const payload: UserState = {
        mastery: manager.mastery,
        attempts: manager.attempts,
        xp: manager.xp,
        prefs: manager.prefs,
      }
      store.dispatch({ type: 'user/setSave', payload })
    },
  })
  try {
    await manager.load()
  } catch {
    await manager.resetProfile()
  }
  store.dispatch({
    type: 'user/setSave',
    payload: {
      mastery: manager.mastery,
      attempts: manager.attempts,
      xp: manager.xp,
      prefs: manager.prefs,
    },
  })
  return manager
}
