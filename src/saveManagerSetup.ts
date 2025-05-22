import path from 'path'
import { SaveManager } from './saveManager'
import { Prefs } from './awardXp'
import { loadWithMigrations } from './migrations'
import { store } from './store'

export let saveManager: SaveManager

export async function initSaveManager() {
  let prefs: Prefs
  try {
    prefs = await loadWithMigrations<Prefs>(path.join('save', 'prefs.json'), 'Prefs-v2')
  } catch {
    prefs = { format: 'Prefs-v2', profile: 'save', xp_since_mixed_quiz: 0, last_as: null, ui_theme: 'default' }
  }
  const dir = prefs.profile
  saveManager = new SaveManager(dir, {
    onChange: () => {
      store.dispatch({
        type: 'user/setSave',
        payload: {
          mastery: saveManager.mastery,
          attempts: saveManager.attempts,
          xp: saveManager.xp,
          prefs: saveManager.prefs,
        },
      })
    },
  })
  await saveManager.load()
}
