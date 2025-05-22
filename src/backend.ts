import { invoke } from '@tauri-apps/api/core'
import { logError } from './logger'

export async function getSchedule(): Promise<any> {
  try {
    const txt: string = await invoke('get_schedule')
    return JSON.parse(txt)
  } catch (e) {
    await logError(String(e))
    throw e
  }
}

export async function openFolder(path: string): Promise<void> {
  try {
    await invoke('open_folder', { path })
  } catch (e) {
    await logError(String(e))
    throw e
  }
}

