import { logError, logDebug } from './logger'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

let dir: string

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(tmpdir(), 'logs-'))
  process.env.LOG_DIR = dir
  process.env.LOG_MAX_SIZE = '50'
})

afterEach(async () => {
  delete process.env.LOG_DIR
  delete process.env.LOG_MAX_SIZE
  delete process.env.NODE_ENV
  await fs.rm(dir, { recursive: true, force: true })
})

describe('logError', () => {
  it('writes message and rotates when size exceeded', async () => {
    await logError('first')
    await logError('second message that is long enough to exceed limit')
    const files = await fs.readdir(dir)
    expect(files.sort()).toEqual(['error.log', 'error.log.1'])
    const rot = await fs.readFile(path.join(dir, 'error.log.1'), 'utf8')
    expect(rot.trim()).toBe('first')
  })
})

describe('logDebug', () => {
  it('skips in production mode', async () => {
    process.env.NODE_ENV = 'production'
    await logDebug('skip')
    const files = await fs.readdir(dir)
    expect(files).toEqual([])
  })

  it('writes in dev mode', async () => {
    process.env.NODE_ENV = 'development'
    await logDebug('hello')
    const txt = await fs.readFile(path.join(dir, 'debug.log'), 'utf8')
    expect(txt.trim()).toBe('hello')
  })
})
