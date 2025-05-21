import { readJson, writeJson } from './fileStore';
import { createEmptyCard } from 'ts-fsrs';

export interface Mastery {
  status: 'unseen' | 'in_progress' | 'mastered';
  card: ReturnType<typeof createEmptyCard>;
  n: number;
  lastGrades: number[];
  next_q_index: number;
}

interface MasteryFile {
  format: string;
  ass: Record<string, Mastery>;
  topics: Record<string, unknown>;
}

const PATH = 'save/mastery.json';

function revive(m: any): Mastery {
  if (!m) {
    return {
      status: 'unseen',
      card: createEmptyCard(new Date()),
      n: 0,
      lastGrades: [],
      next_q_index: 0,
    };
  }
  if (m.card && m.card.due) m.card.due = new Date(m.card.due);
  if (m.card && m.card.last_review) m.card.last_review = new Date(m.card.last_review);
  return m as Mastery;
}

async function loadFile(): Promise<MasteryFile> {
  const data = await readJson(PATH);
  if (data && data.ass) {
    return data as MasteryFile;
  }
  return { format: 'Mastery-v2', ass: {}, topics: {} };
}

async function saveFile(data: MasteryFile) {
  await writeJson(PATH, data);
}

export async function loadMastery(asId: string): Promise<Mastery> {
  const mf = await loadFile();
  return revive(mf.ass[asId]);
}

export async function saveMastery(asId: string, m: Mastery) {
  const mf = await loadFile();
  mf.ass[asId] = m;
  await saveFile(mf);
}

export async function loadAllMastery(): Promise<Record<string, Mastery>> {
  const mf = await loadFile();
  const out: Record<string, Mastery> = {};
  for (const [k, v] of Object.entries(mf.ass)) {
    out[k] = revive(v);
  }
  return out;
}

export async function clearAllMastery() {
  await saveFile({ format: 'Mastery-v2', ass: {}, topics: {} });
}
