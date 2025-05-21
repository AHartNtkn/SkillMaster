const isTauri = typeof window !== 'undefined' && '__TAURI__' in (window as any);

async function ensureDir(dir: string) {
  if (isTauri) {
    const fs = await import('@tauri-apps/api/fs');
    await fs.createDir(dir, { dir: fs.BaseDirectory.App, recursive: true });
  } else {
    const fs = await import('fs/promises');
    await fs.mkdir(dir, { recursive: true });
  }
}

async function readText(path: string): Promise<string | null> {
  if (isTauri) {
    const fs = await import('@tauri-apps/api/fs');
    const exists = await fs.exists(path, { dir: fs.BaseDirectory.App });
    if (!exists) return null;
    return await fs.readTextFile(path, { dir: fs.BaseDirectory.App });
  } else {
    const fs = await import('fs/promises');
    try {
      return await fs.readFile(path, 'utf8');
    } catch {
      return null;
    }
  }
}

async function writeText(path: string, data: string) {
  if (isTauri) {
    const fs = await import('@tauri-apps/api/fs');
    await fs.writeFile({ path, contents: data }, { dir: fs.BaseDirectory.App });
  } else {
    const fs = await import('fs/promises');
    await fs.writeFile(path, data, 'utf8');
  }
}

export async function readJson(path: string): Promise<any | null> {
  const txt = await readText(path);
  if (!txt) return null;
  try {
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

export async function writeJson(path: string, data: any) {
  await ensureDir(path.split('/').slice(0, -1).join('/'));
  await writeText(path, JSON.stringify(data, null, 2));
}
