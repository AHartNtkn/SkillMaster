import { loadJsonSync, saveJsonSync } from './storage';

export interface XpEntry {
  id: number;
  ts: string;
  delta: number;
  source: string;
}

interface XpFile {
  format: string;
  log: XpEntry[];
}

const DEFAULT_FILE: XpFile = { format: 'XP-v1', log: [] };

let cache: XpFile | null = null;

function ensure() {
  if (!cache) cache = loadJsonSync('xp.json', DEFAULT_FILE);
}

export function loadLog(): XpEntry[] {
  ensure();
  return cache!.log;
}

export function appendEntry(delta: number, source: string) {
  ensure();
  const nextId = cache!.log.length > 0 ? cache!.log[cache!.log.length - 1].id + 1 : 1;
  cache!.log.push({ id: nextId, ts: new Date().toISOString(), delta, source });
  saveJsonSync('xp.json', cache);
}

export function getAllXp(): XpFile {
  ensure();
  return cache!;
}

export function resetAll() {
  cache = { ...DEFAULT_FILE };
  saveJsonSync('xp.json', cache);
}

export function overwriteXp(data: XpFile) {
  cache = { ...DEFAULT_FILE, ...data };
  saveJsonSync('xp.json', cache);
}
