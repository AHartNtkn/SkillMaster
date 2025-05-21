import { readTextFile, writeTextFile, createDir, BaseDirectory, exists } from '@tauri-apps/api/fs';

const SAVE_DIR = 'save';

async function ensureSaveDir() {
  if (!(await exists(SAVE_DIR, { dir: BaseDirectory.App }))) {
    await createDir(SAVE_DIR, { dir: BaseDirectory.App, recursive: true });
  }
}

export async function readJSON<T>(file: string, fallback: T): Promise<T> {
  await ensureSaveDir();
  const path = `${SAVE_DIR}/${file}`;
  try {
    const text = await readTextFile(path, { dir: BaseDirectory.App });
    return JSON.parse(text) as T;
  } catch {
    await writeTextFile(path, JSON.stringify(fallback, null, 2), { dir: BaseDirectory.App });
    return JSON.parse(JSON.stringify(fallback)) as T;
  }
}

export async function writeJSON(file: string, data: unknown): Promise<void> {
  await ensureSaveDir();
  const path = `${SAVE_DIR}/${file}`;
  await writeTextFile(path, JSON.stringify(data, null, 2), { dir: BaseDirectory.App });
}
