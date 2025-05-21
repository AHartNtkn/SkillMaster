import { createEmptyCard } from 'ts-fsrs';

const tauriFs = (window as any)?.__TAURI__?.fs;

async function readText(path: string): Promise<string | null> {
  if (tauriFs && tauriFs.readTextFile) {
    try {
      return await tauriFs.readTextFile(path);
    } catch {
      return null;
    }
  }
  try {
    return localStorage.getItem(path);
  } catch {
    return null;
  }
}

async function writeText(path: string, contents: string): Promise<void> {
  if (tauriFs && tauriFs.writeTextFile) {
    try {
      await tauriFs.writeTextFile({ path, contents });
      return;
    } catch {
      // fall through to localStorage
    }
  }
  localStorage.setItem(path, contents);
}

async function readJson<T>(path: string, def: T): Promise<T> {
  const txt = await readText(path);
  if (!txt) return def;
  try {
    return JSON.parse(txt) as T;
  } catch {
    return def;
  }
}

async function writeJson<T>(path: string, data: T): Promise<void> {
  await writeText(path, JSON.stringify(data, null, 2));
}

export interface Prefs {
  xp_since_mixed_quiz: number;
  last_as: string;
  ui_theme: 'default' | 'dark';
}

export const DEFAULT_PREFS: Prefs = {
  xp_since_mixed_quiz: 0,
  last_as: '',
  ui_theme: 'default',
};

const PREFS_PATH = 'save/prefs.json';
const MASTERY_PATH = 'save/mastery.json';
const XP_PATH = 'save/xp.json';
const SKILL_LOG_PATH = 'save/skill_log.json';

export interface Mastery {
  status: 'unseen' | 'in_progress' | 'mastered';
  card: any;
  n: number;
  lastGrades: number[];
  next_q_index: number;
}

interface MasteryFile {
  format: string;
  ass: Record<string, Mastery>;
  topics: Record<string, unknown>;
}

export async function loadPrefs(): Promise<Prefs> {
  return readJson(PREFS_PATH, { ...DEFAULT_PREFS });
}

export async function savePrefs(p: Prefs): Promise<void> {
  await writeJson(PREFS_PATH, p);
}

async function loadMasteryFile(): Promise<MasteryFile> {
  return readJson(MASTERY_PATH, { format: 'Mastery-v2', ass: {}, topics: {} });
}

export async function loadMastery(asId: string): Promise<Mastery> {
  const file = await loadMasteryFile();
  const m = file.ass[asId];
  if (m) {
    m.card.due = new Date(m.card.due);
    if (m.card.last_review) m.card.last_review = new Date(m.card.last_review);
    return m;
  }
  return {
    status: 'unseen',
    card: createEmptyCard(new Date()),
    n: 0,
    lastGrades: [],
    next_q_index: 0,
  };
}

export async function saveMastery(asId: string, mastery: Mastery): Promise<void> {
  const file = await loadMasteryFile();
  file.ass[asId] = mastery;
  await writeJson(MASTERY_PATH, file);
}

export async function loadAllMasteries(): Promise<Record<string, Mastery>> {
  const file = await loadMasteryFile();
  const out: Record<string, Mastery> = {};
  for (const [k, v] of Object.entries(file.ass)) {
    v.card.due = new Date((v as any).card.due);
    if ((v as any).card.last_review) v.card.last_review = new Date((v as any).card.last_review);
    out[k] = v;
  }
  return out;
}

export interface XpEntry { id: number; ts: string; delta: number; source: string; }
export interface SkillEntry { id: number; ts: string; asId: string; type: 'review' | 'mastered'; }

interface LogFile<T> { format: string; log: T[]; }

export async function loadXpLog(): Promise<XpEntry[]> {
  const file = await readJson<LogFile<XpEntry>>(XP_PATH, { format: 'XP-v1', log: [] });
  return file.log;
}

export async function saveXpLog(log: XpEntry[]): Promise<void> {
  await writeJson<LogFile<XpEntry>>(XP_PATH, { format: 'XP-v1', log });
}

export async function loadSkillLog(): Promise<SkillEntry[]> {
  const file = await readJson<LogFile<SkillEntry>>(SKILL_LOG_PATH, { format: 'SkillLog-v1', log: [] });
  return file.log;
}

export async function saveSkillLog(log: SkillEntry[]): Promise<void> {
  await writeJson<LogFile<SkillEntry>>(SKILL_LOG_PATH, { format: 'SkillLog-v1', log });
}

export async function resetAllData(): Promise<void> {
  await writeJson(MASTERY_PATH, { format: 'Mastery-v2', ass: {}, topics: {} });
  await writeJson(PREFS_PATH, { ...DEFAULT_PREFS });
  await writeJson(XP_PATH, { format: 'XP-v1', log: [] });
  await writeJson(SKILL_LOG_PATH, { format: 'SkillLog-v1', log: [] });
}
