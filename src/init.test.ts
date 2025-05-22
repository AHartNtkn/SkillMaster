import { describe, it, expect } from 'vitest'
import path from 'path'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { init } from './init'
import { createAppStore } from './store'

const root = process.cwd()

describe('init', () => {
  it('rebuilds index when topic files change', async () => {
    const tmp = await fs.mkdtemp(path.join(tmpdir(), 'init-'))
    await fs.mkdir(path.join(tmp, 'course'), { recursive: true })
    await fs.cp(path.join(root, 'course/ea'), path.join(tmp, 'course/ea'), { recursive: true })
    await fs.writeFile(
      path.join(tmp, 'courses.json'),
      JSON.stringify({ format: 'Courses-v1', courses: [{ id: 'EA', name: 'EA', path: 'course/ea/' }] })
    )
    const store = createAppStore()

    await init(store, tmp)
    const indexPath = path.join(tmp, '.cache/index.db')
    const m1 = (await fs.stat(indexPath)).mtimeMs

    await init(store, tmp)
    const m2 = (await fs.stat(indexPath)).mtimeMs
    expect(m2).toBe(m1)

    const topic = path.join(tmp, 'course/ea/topics/T001.json')
    const txt = await fs.readFile(topic, 'utf8')
    await fs.writeFile(topic, txt)

    await init(store, tmp)
    const m3 = (await fs.stat(indexPath)).mtimeMs
    expect(m3).toBeGreaterThan(m2)
  })
})
