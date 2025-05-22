import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { boot } from './boot'
import { store, setIndex } from './store'
import * as indexBuilder from './indexBuilder'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

const repoRoot = process.cwd()

async function makeTempRoot() {
  return await fs.mkdtemp(path.join(tmpdir(), 'boot-'))
}

async function writeCourses(file: string) {
  const content = {
    format: 'Courses-v1',
    courses: [{ id: 'EA', name: 'EA', path: path.join(repoRoot, 'course/ea') }],
  }
  await fs.writeFile(file, JSON.stringify(content))
}

describe('boot', () => {
  let cwd: string
  beforeEach(() => {
    cwd = process.cwd()
  })
  afterEach(() => {
    process.chdir(cwd)
    store.dispatch(setIndex({ dist: {}, asCount: {} }))
    vi.restoreAllMocks()
  })

  it('builds index when missing', async () => {
    const dir = await makeTempRoot()
    await writeCourses(path.join(dir, 'courses.json'))
    const { invoke } = await import('@tauri-apps/api/core')
    ;(invoke as any).mockResolvedValue(await fs.readFile(path.join(dir, 'courses.json'), 'utf8'))
    process.chdir(dir)
    await boot()
    const state = store.getState()
    expect(Object.keys(state.asCount).length).toBeGreaterThan(0)
    const files = await fs.readdir(path.join(dir, '.cache'))
    expect(files).toContain('index.json')
  })

  it('uses cached index when up to date', async () => {
    const dir = await makeTempRoot()
    await fs.mkdir(path.join(dir, '.cache'))
    const indexPath = path.join(dir, '.cache', 'index.json')
    const data = { dist: { A: { B: 1 } }, asCount: { T: 1 } }
    await fs.writeFile(indexPath, JSON.stringify(data))
    const mtime = new Date(Date.now() + 1000)
    await fs.utimes(indexPath, mtime, mtime)
    await writeCourses(path.join(dir, 'courses.json'))
    const { invoke } = await import('@tauri-apps/api/core')
    ;(invoke as any).mockResolvedValue(await fs.readFile(path.join(dir, 'courses.json'), 'utf8'))
    const spy = vi.spyOn(indexBuilder, 'buildIndex')
    process.chdir(dir)
    await boot()
    expect(spy).not.toHaveBeenCalled()
    const state = store.getState()
    expect(state.asCount.T).toBe(1)
  })
})
