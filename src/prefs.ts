export interface Prefs {
  xp_since_mixed_quiz: number;
  last_as: string;
  ui_theme: 'default' | 'dark';
}

const DEFAULT_PREFS: Prefs = {
  xp_since_mixed_quiz: 0,
  last_as: '',
  ui_theme: 'default'
};

import { ensureSaveDir, loadPrefs as loadPrefsFile, savePrefs as savePrefsFile } from './storage';

export function loadPrefs(): Prefs {
  ensureSaveDir();
  try {
    const obj = loadPrefsFile();
    return { ...DEFAULT_PREFS, ...obj } as Prefs;
  } catch (e) {
    console.error('Failed to load prefs', e);
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(p: Prefs) {
  try {
    savePrefsFile(p);
  } catch (e) {
    console.error('Failed to save prefs', e);
  }
}
