import fs from 'fs';
import path from 'path';

const SAVE_DIR = path.resolve('save');

export function ensureSaveDir() {
  if (!fs.existsSync(SAVE_DIR)) {
    fs.mkdirSync(SAVE_DIR, { recursive: true });
  }
}

function readJson(file: string, def: any) {
  try {
    const p = path.join(SAVE_DIR, file);
    const txt = fs.readFileSync(p, 'utf8');
    return JSON.parse(txt);
  } catch {
    return def;
  }
}

function writeJson(file: string, data: any) {
  ensureSaveDir();
  const p = path.join(SAVE_DIR, file);
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

export function loadPrefs() {
  return readJson('prefs.json', {
    xp_since_mixed_quiz: 0,
    last_as: '',
    ui_theme: 'default',
  });
}

export function savePrefs(p: any) {
  writeJson('prefs.json', p);
}

export function loadMasteryStore() {
  return readJson('mastery.json', { format: 'Mastery-v2', ass: {} });
}

export function saveMasteryStore(store: any) {
  writeJson('mastery.json', store);
}

export function loadXpLog() {
  return readJson('xp.json', { format: 'XP-v1', log: [] }).log;
}

export function saveXpLog(log: any[]) {
  writeJson('xp.json', { format: 'XP-v1', log });
}

export function loadSkillLog() {
  return readJson('skill_log.json', { format: 'SkillLog-v1', log: [] }).log;
}

export function saveSkillLog(log: any[]) {
  writeJson('skill_log.json', { format: 'SkillLog-v1', log });
}
