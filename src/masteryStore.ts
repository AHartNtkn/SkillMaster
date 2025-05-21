import { loadJsonSync, saveJsonSync } from './storage';
import { initMastery } from './engine.js';

export interface MasteryRecord {
  status: 'unseen' | 'in_progress' | 'mastered';
  card: any;
  n: number;
  lastGrades: number[];
  next_q_index: number;
}

interface MasteryFile {
  format: string;
  ass: Record<string, MasteryRecord>;
  topics: Record<string, unknown>;
}

const DEFAULT_FILE: MasteryFile = { format: 'Mastery-v2', ass: {}, topics: {} };

let cache: MasteryFile | null = null;

function ensure() {
  if (!cache) cache = loadJsonSync('mastery.json', DEFAULT_FILE);
}

export function loadMastery(asId: string): MasteryRecord {
  ensure();
  return cache!.ass[asId] || initMastery();
}

export function saveMastery(asId: string, m: MasteryRecord) {
  ensure();
  cache!.ass[asId] = m;
  saveJsonSync('mastery.json', cache);
}

export function getAllMastery(): MasteryFile {
  ensure();
  return cache!;
}

export function resetAll() {
  cache = { ...DEFAULT_FILE };
  saveJsonSync('mastery.json', cache);
}

export function overwriteMastery(data: MasteryFile) {
  cache = { ...DEFAULT_FILE, ...data };
  saveJsonSync('mastery.json', cache);
}
