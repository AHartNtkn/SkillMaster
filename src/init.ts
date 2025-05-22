import path from 'path'
import { promises as fs } from 'fs'
import { loadCourseRegistry, loadCatalog } from './courseRegistry'
import { loadSkills, buildIndex, SkillEntry, IndexData } from './indexBuilder'
import type { AppStore, CoursesState } from './store'

async function newestMTime(dir: string): Promise<number> {
  const files = await fs.readdir(dir)
  let m = 0
  for (const f of files) {
    const stat = await fs.stat(path.join(dir, f))
    if (stat.mtimeMs > m) m = stat.mtimeMs
  }
  return m
}

async function needsRebuild(indexPath: string, courseDirs: string[]): Promise<boolean> {
  try {
    const stat = await fs.stat(indexPath)
    const data = JSON.parse(await fs.readFile(indexPath, 'utf8')) as { courses?: string[] }
    if (!Array.isArray(data.courses)) return true
    if (data.courses.join('|') !== courseDirs.join('|')) return true
    const indexTime = stat.mtimeMs
    for (const dir of courseDirs) {
      const m = await newestMTime(path.join(dir, 'topics'))
      if (m > indexTime) return true
    }
    return false
  } catch {
    return true
  }
}

export interface InitResult {
  catalogs: Record<string, any>
  skills: Record<string, SkillEntry>
  index: IndexData
}

export async function init(store: AppStore, rootDir = process.cwd()): Promise<InitResult> {
  const registryFile = path.join(rootDir, 'courses.json')
  const courses = await loadCourseRegistry(registryFile)
  const catalogs: Record<string, any> = {}
  const skills: Record<string, SkillEntry> = {}
  const dirs: string[] = []

  for (const c of courses) {
    const dir = path.join(rootDir, c.path)
    dirs.push(dir)
    const cat = await loadCatalog(path.join(dir, 'catalog.json'))
    catalogs[c.id] = cat
    Object.assign(skills, await loadSkills(dir))
  }

  const indexPath = path.join(rootDir, '.cache', 'index.db')
  const rebuild = await needsRebuild(indexPath, dirs)
  const index = rebuild ? await buildIndex(dirs, indexPath) : JSON.parse(await fs.readFile(indexPath, 'utf8')) as IndexData

  const payload: CoursesState = { catalogs, skills }
  store.dispatch({ type: 'courses/setData', payload })

  return { catalogs, skills, index }
}
