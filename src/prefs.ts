import { readJson, writeJson } from './fileStore';

export interface Prefs {
  xp_since_mixed_quiz: number;
  last_as: string;
  ui_theme: 'default' | 'dark';
}

const DEFAULT_PREFS: Prefs = {
  xp_since_mixed_quiz: 0,
  last_as: '',
  ui_theme: 'default',
};

const PATH = 'save/prefs.json';

export async function loadPrefs(): Promise<Prefs> {
  try {
    const obj = await readJson(PATH);
    if (!obj) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...(obj as Partial<Prefs>) };
  } catch (e) {
    console.error('Failed to load prefs', e);
    return { ...DEFAULT_PREFS };
  }
}

export async function savePrefs(p: Prefs) {
  try {
    await writeJson(PATH, p);
  } catch (e) {
    console.error('Failed to save prefs', e);
  }
}
