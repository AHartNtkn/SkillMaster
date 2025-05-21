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

import { loadJsonSync, saveJsonSync } from './storage';

export function loadPrefs(): Prefs {
  try {
    return loadJsonSync('prefs.json', { ...DEFAULT_PREFS });
  } catch (e) {
    console.error('Failed to load prefs', e);
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(p: Prefs) {
  try {
    saveJsonSync('prefs.json', p);
  } catch (e) {
    console.error('Failed to save prefs', e);
  }
}
