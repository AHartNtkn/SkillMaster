import { invoke } from '@tauri-apps/api/core'
import { promises as fs, existsSync } from 'fs'
import path from 'path'
import { loadTopics, loadSkills, loadEdges, buildIndex, IndexData } from './indexBuilder'
import { store, setIndex } from './store'

interface CourseEntry {
  id: string
  name: string
  path: string
}

interface CourseRegistry {
  format: string
  courses: CourseEntry[]
}

async function courseTimestamp(dir: string): Promise<number> {
  let latest = 0
  const tdir = path.join(dir, 'topics')
  const sdir = path.join(dir, 'skills')
  const topicFiles = await fs.readdir(tdir)
  for (const f of topicFiles) {
    const stat = await fs.stat(path.join(tdir, f))
    if (stat.mtimeMs > latest) latest = stat.mtimeMs
  }
  const skillFiles = await fs.readdir(sdir)
  for (const f of skillFiles) {
    const stat = await fs.stat(path.join(sdir, f))
    if (stat.mtimeMs > latest) latest = stat.mtimeMs
  }
  const estat = await fs.stat(path.join(dir, 'edges.csv'))
  if (estat.mtimeMs > latest) latest = estat.mtimeMs
  return latest
}

export async function boot(): Promise<void> {
  const root = process.cwd()
  const coursesFile = path.join(root, 'courses.json')
  const text: string = await invoke('read_text_file', { path: coursesFile })
  const registry = JSON.parse(text) as CourseRegistry
  const courseDirs = registry.courses.map(c => path.isAbsolute(c.path) ? c.path : path.join(root, c.path))

  for (const dir of courseDirs) {
    await loadTopics(dir)
    await loadSkills(dir)
    await loadEdges(dir)
  }

  const indexPath = path.join(root, '.cache', 'index.json')
  let indexData: IndexData
  let rebuild = true
  if (existsSync(indexPath)) {
    const istat = await fs.stat(indexPath)
    let latest = (await fs.stat(coursesFile)).mtimeMs
    for (const dir of courseDirs) {
      const ts = await courseTimestamp(dir)
      if (ts > latest) latest = ts
    }
    rebuild = latest > istat.mtimeMs
    if (!rebuild) {
      const saved = await fs.readFile(indexPath, 'utf8')
      indexData = JSON.parse(saved) as IndexData
    }
  }
  if (rebuild) {
    indexData = await buildIndex(courseDirs, indexPath)
  }
  store.dispatch(setIndex(indexData!))
}
