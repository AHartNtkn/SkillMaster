import { readJSON, writeJSON } from './fileStore';

export interface Prefs {
  xp_since_mixed_quiz: number;
  last_as: string;
  ui_theme: 'default' | 'dark';
}

export const DEFAULT_PREFS: Prefs = {
  xp_since_mixed_quiz: 0,
  last_as: '',
  ui_theme: 'default'
};

export async function loadPrefs(): Promise<Prefs> {
  try {
    const obj = await readJSON<Prefs>('prefs.json', DEFAULT_PREFS);
    return { ...DEFAULT_PREFS, ...obj } as Prefs;
  } catch (e) {
    console.error('Failed to load prefs', e);
    return { ...DEFAULT_PREFS };
  }
}

export async function savePrefs(p: Prefs): Promise<void> {
  try {
    await writeJSON('prefs.json', p);
  } catch (e) {
    console.error('Failed to save prefs', e);
  }
}
