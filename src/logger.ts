import { promises as fs } from 'fs'
import path from 'path'
import { invoke } from '@tauri-apps/api/core'

const ROTATIONS = 3

function logDir() {
  return process.env.LOG_DIR || path.join(process.cwd(), 'logs')
}

function maxSize() {
  return Number(process.env.LOG_MAX_SIZE) || 5 * 1024 * 1024
}

async function ensureDir() {
  await fs.mkdir(logDir(), { recursive: true })
}

async function rotate(file: string) {
  try {
    await fs.stat(file)
  } catch {
    return
  }
  for (let i = ROTATIONS - 1; i >= 0; i--) {
    const src = i === 0 ? file : `${file}.${i}`
    try {
      await fs.stat(src)
    } catch {
      continue
    }
    if (i + 1 >= ROTATIONS) {
      await fs.unlink(src).catch(() => {})
    } else {
      await fs.rename(src, `${file}.${i + 1}`)
    }
  }
}

async function append(file: string, msg: string) {
  await ensureDir()
  let stat
  try {
    stat = await fs.stat(file)
  } catch {}
  const newSize = (stat?.size ?? 0) + Buffer.byteLength(msg + '\n')
  if (stat && newSize > maxSize()) await rotate(file)
  await fs.appendFile(file, msg + '\n')
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

export async function logError(msg: string) {
  if (isTauri()) {
    await invoke('log_error', { msg })
  } else {
    await append(path.join(logDir(), 'error.log'), msg)
  }
}

export async function logDebug(msg: string) {
  if (process.env.NODE_ENV === 'production') return
  if (isTauri()) {
    await invoke('log_debug', { msg })
  } else {
    await append(path.join(logDir(), 'debug.log'), msg)
  }
}
