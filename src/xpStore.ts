import { readJson, writeJson } from './fileStore';

export interface XpEntry {
  id: number;
  ts: string;
  delta: number;
  source: string;
}

export interface SkillEntry {
  id: number;
  ts: string;
  asId: string;
  type: 'review' | 'mastered';
}

interface XPFile {
  format: string;
  log: XpEntry[];
  skill_log: SkillEntry[];
}

const PATH = 'save/xp.json';

async function loadFile(): Promise<XPFile> {
  const d = await readJson(PATH);
  if (d && d.log) return { format: 'XP-v1', skill_log: [], ...(d as any) };
  return { format: 'XP-v1', log: [], skill_log: [] };
}

async function saveFile(f: XPFile) {
  await writeJson(PATH, f);
}

export async function loadXpLog(): Promise<XpEntry[]> {
  const f = await loadFile();
  return f.log;
}

export async function loadSkillLog(): Promise<SkillEntry[]> {
  const f = await loadFile();
  return f.skill_log || [];
}

export async function saveXpLog(log: XpEntry[]) {
  const f = await loadFile();
  f.log = log;
  await saveFile(f);
}

export async function saveSkillLog(log: SkillEntry[]) {
  const f = await loadFile();
  f.skill_log = log;
  await saveFile(f);
}
