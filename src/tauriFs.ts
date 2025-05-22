const isTauriEnv = typeof window !== 'undefined' && '__TAURI__' in window

export function isTauri(): boolean {
  return isTauriEnv
}

export async function readText(path: string): Promise<string> {
  if (isTauriEnv) {
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke<string>('read_text', { path })
  } else {
    const { readFile } = await import('fs/promises')
    return readFile(path, 'utf8')
  }
}

export async function writeText(path: string, content: string): Promise<void> {
  if (isTauriEnv) {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('write_text', { path, content })
  } else {
    const { writeFile } = await import('fs/promises')
    await writeFile(path, content)
  }
}
