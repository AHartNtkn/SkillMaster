import { describe, it, expect } from 'vitest'
import path from 'path'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { loadCourseRegistry, loadCatalog } from './courseRegistry'

const root = process.cwd()

describe('loadCourseRegistry', () => {
  it('loads sample registry', async () => {
    const file = path.join(root, 'courses.json')
    const courses = await loadCourseRegistry(file)
    expect(courses.length).toBeGreaterThan(0)
    expect(courses[0].id).toBe('EA')
  })

  it('throws on invalid registry', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'cr-'))
    const file = path.join(dir, 'courses.json')
    await fs.writeFile(file, JSON.stringify({ format: 'Courses-v1' }))
    await expect(loadCourseRegistry(file)).rejects.toThrow()
  })
})

describe('loadCatalog', () => {
  it('loads sample catalog', async () => {
    const file = path.join(root, 'course/ea/catalog.json')
    const cat = await loadCatalog(file)
    expect(cat.course_id).toBe('EA')
    expect(cat.entry_topics.length).toBeGreaterThan(0)
  })

  it('throws on invalid catalog', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'cat-'))
    const file = path.join(dir, 'catalog.json')
    await fs.writeFile(file, JSON.stringify({ format: 'Catalog-v0' }))
    await expect(loadCatalog(file)).rejects.toThrow()
  })
})
