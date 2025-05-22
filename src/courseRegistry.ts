import { promises as fs } from 'fs'
import { invoke } from '@tauri-apps/api/core'
import { logError } from './logger'
import path from 'path'

export interface CourseEntry {
  id: string
  name: string
  path: string
}

export interface CourseRegistry {
  format: string
  courses: CourseEntry[]
}

/**
 * Load the global course registry from a JSON file.
 */
export async function loadCourseRegistry(file: string): Promise<CourseEntry[]> {
  let text: string
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    try {
      text = await invoke('read_file', { path: file })
    } catch (e) {
      await logError(String(e))
      throw e
    }
  } else {
    text = await fs.readFile(file, 'utf8')
  }
  const data = JSON.parse(text) as CourseRegistry
  if (data.format !== 'Courses-v1' || !Array.isArray(data.courses)) {
    throw new Error('Invalid course registry')
  }
  return data.courses.map(c => ({ ...c, path: path.normalize(c.path) }))
}

export interface Catalog {
  format: string
  course_id: string
  entry_topics: string[]
  description: string
}

/**
 * Load a course catalog file.
 */
export async function loadCatalog(file: string): Promise<Catalog> {
  let text: string
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    try {
      text = await invoke('read_file', { path: file })
    } catch (e) {
      await logError(String(e))
      throw e
    }
  } else {
    text = await fs.readFile(file, 'utf8')
  }
  const data = JSON.parse(text) as Catalog
  if (data.format !== 'Catalog-v1') {
    throw new Error('Invalid catalog')
  }
  return data
}
