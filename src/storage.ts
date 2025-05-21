const fs = typeof window === 'undefined' ? require('fs/promises') : null;
const path = typeof window === 'undefined' ? require('path') : null;

// Detect Tauri runtime
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

let tauriFs: any = null;

if (isTauri) {
  try {
    tauriFs = require('@tauri-apps/api/fs');
  } catch {}
}

const SAVE_DIR = 'save';

async function ensureDir() {
  if (isTauri && tauriFs) {
    const { exists, createDir, BaseDirectory } = tauriFs;
    if (!(await exists(SAVE_DIR, { dir: BaseDirectory.App }))) {
      await createDir(SAVE_DIR, { dir: BaseDirectory.App, recursive: true });
    }
  } else if (fs && path) {
    await fs.mkdir(path.join(process.cwd(), SAVE_DIR), { recursive: true });
  }
}

async function readFile(fullPath: string): Promise<string | null> {
  if (isTauri && tauriFs) {
    const { readTextFile, exists, BaseDirectory } = tauriFs;
    if (!(await exists(fullPath, { dir: BaseDirectory.App }))) return null;
    return await readTextFile(fullPath, { dir: BaseDirectory.App });
  } else if (fs && path) {
    try {
      return await fs.readFile(path.join(process.cwd(), fullPath), 'utf8');
    } catch {
      return null;
    }
  }
  return null;
}

async function atomicWrite(fullPath: string, data: string) {
  if (isTauri && tauriFs) {
    const { writeFile, BaseDirectory } = tauriFs;
    await writeFile({ path: fullPath + '.tmp', contents: data }, { dir: BaseDirectory.App });
    await writeFile({ path: fullPath, contents: data }, { dir: BaseDirectory.App });
  } else if (fs && path) {
    const tmp = path.join(process.cwd(), fullPath + '.tmp');
    const final = path.join(process.cwd(), fullPath);
    await fs.writeFile(tmp, data);
    const fd = await fs.open(tmp, 'r');
    await fd.sync();
    await fd.close();
    await fs.rename(tmp, final);
  }
}

export async function loadJson<T>(file: string, def: T): Promise<T> {
  await ensureDir();
  const txt = await readFile(`${SAVE_DIR}/${file}`);
  if (!txt) return def;
  try {
    return { ...def, ...JSON.parse(txt) };
  } catch {
    return def;
  }
}

export async function saveJson(file: string, data: unknown) {
  await ensureDir();
  const txt = JSON.stringify(data, null, 2);
  await atomicWrite(`${SAVE_DIR}/${file}`, txt);
}

export function loadJsonSync<T>(file: string, def: T): T {
  if (fs && path) {
    try {
      const full = path.join(process.cwd(), SAVE_DIR, file);
      if (!require('fs').existsSync(full)) return def;
      const txt = require('fs').readFileSync(full, 'utf8');
      return { ...def, ...JSON.parse(txt) };
    } catch {
      return def;
    }
  }
  throw new Error('Synchronous storage not available');
}

export function saveJsonSync(file: string, data: unknown) {
  if (fs && path) {
    const fsSync = require('fs');
    const dir = path.join(process.cwd(), SAVE_DIR);
    fsSync.mkdirSync(dir, { recursive: true });
    const tmp = path.join(dir, file + '.tmp');
    fsSync.writeFileSync(tmp, JSON.stringify(data, null, 2));
    const fd = fsSync.openSync(tmp, 'r');
    fsSync.fsyncSync(fd);
    fsSync.closeSync(fd);
    fsSync.renameSync(tmp, path.join(dir, file));
    return;
  }
  throw new Error('Synchronous storage not available');
}
