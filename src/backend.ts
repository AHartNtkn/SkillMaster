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
