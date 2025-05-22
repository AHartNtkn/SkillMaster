import { promises as fs } from 'fs'
import { existsSync } from 'fs'
import { invoke } from '@tauri-apps/api/core'
import { logError } from './logger'

/**
 * Atomically write data to a file using a temporary .tmp file then rename.
 */
export async function atomicWriteFile(path: string, data: string | Buffer): Promise<void> {
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    try {
      await invoke('write_file', { path, data: data.toString() })
    } catch (e) {
      await logError(String(e))
      throw e
    }
  } else {
    const tmp = path + '.tmp'
    const handle = await fs.open(tmp, 'w')
    try {
      await handle.writeFile(data)
      await handle.sync()
    } finally {
      await handle.close()
    }
    await fs.rename(tmp, path)
  }
}

/**
 * Read a JSON file, recovering from a leftover .tmp if present.
 */
export async function readJsonWithRecovery<T>(path: string): Promise<T> {
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    try {
      const text: string = await invoke('read_file', { path })
      return JSON.parse(text) as T
    } catch (e) {
      await logError(String(e))
      throw e
    }
  } else {
    const tmp = path + '.tmp'
    if (existsSync(tmp) && !existsSync(path)) {
      await fs.rename(tmp, path)
    }
    const text = await fs.readFile(path, 'utf8')
    return JSON.parse(text) as T
  }
}
