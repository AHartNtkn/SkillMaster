export interface DistMatrix {
  [src: string]: Record<string, number>
}

export interface Edge {
  src: string
  dst: string
  weight: number
}

export function floydWarshall(nodes: string[], edges: Array<[string, string]>): DistMatrix {
  const index: Record<string, number> = {}
  nodes.forEach((n, i) => { index[n] = i })
  const n = nodes.length
  const dist: number[][] = Array.from({ length: n }, () => Array(n).fill(Infinity))
  for (let i = 0; i < n; i++) dist[i][i] = 0
  for (const [a, b] of edges) {
    const i = index[a]
    const j = index[b]
    if (i === undefined || j === undefined) continue
    dist[i][j] = 1
    dist[j][i] = 1
  }
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j]
        }
      }
    }
  }
  const result: DistMatrix = {}
  for (let i = 0; i < n; i++) {
    const row: Record<string, number> = {}
    for (let j = 0; j < n; j++) {
      if (isFinite(dist[i][j])) row[nodes[j]] = dist[i][j]
    }
    result[nodes[i]] = row
  }
  return result
}

import path from 'path'
import { readText, writeText } from './tauriFs'
import { promises as fs } from 'fs'

export interface TopicEntry {
  id: string
  name: string
  ass: string[]
}

export async function loadTopics(coursePath: string): Promise<TopicEntry[]> {
  const dir = path.join(coursePath, 'topics')
  const files = await fs.readdir(dir)
  const topics: TopicEntry[] = []
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window
  for (const f of files) {
    const p = path.join(dir, f)
    const txt = isTauri ? await readText(p) : await fs.readFile(p, 'utf8')
    topics.push(JSON.parse(txt))
  }
  return topics
}

export interface SkillEntry {
  id: string
  name: string
  prereqs?: string[]
  weights?: Record<string, number>
}

export async function loadSkills(coursePath: string): Promise<Record<string, SkillEntry>> {
  const dir = path.join(coursePath, 'skills')
  const files = await fs.readdir(dir)
  const skills: Record<string, SkillEntry> = {}
  for (const f of files) {
    const txt = await fs.readFile(path.join(dir, f), 'utf8')
    const data = JSON.parse(txt) as SkillEntry
    skills[data.id] = data
  }
  return skills
}

export async function loadEdges(coursePath: string): Promise<Edge[]> {
  const file = path.join(coursePath, 'edges.csv')
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window
  const text = isTauri ? await readText(file) : await fs.readFile(file, 'utf8')
  const lines = text.trim().split(/\r?\n/).slice(1)
  return lines.map((line) => {
    const [src, dst, weight] = line.split(',')
    return { src, dst, weight: parseFloat(weight) }
  })
}

export interface IndexData {
  dist: DistMatrix
  asCount: Record<string, number>
}

async function buildIndexLocal(courseDirs: string[], outFile: string): Promise<IndexData> {
  const edges: Array<[string, string]> = []
  const asCount: Record<string, number> = {}
  const nodes = new Set<string>()
  for (const dir of courseDirs) {
    const topics = await loadTopics(dir)
    for (const t of topics) {
      asCount[t.id] = t.ass.length
    }
    const es = await loadEdges(dir)
    for (const e of es) {
      edges.push([e.src, e.dst])
      nodes.add(e.src)
      nodes.add(e.dst)
    }
  }
  const nodeList = Array.from(nodes)
  const dist = floydWarshall(nodeList, edges)
  await fs.mkdir(path.dirname(outFile), { recursive: true })
  await fs.writeFile(outFile, JSON.stringify({ dist, asCount }, null, 2))
  return { dist, asCount }
}

export async function buildIndex(courseDirs: string[], outFile: string): Promise<IndexData> {
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window
  if (isTauri) {
    const { invoke } = await import('@tauri-apps/api/core')
    const index = await invoke<IndexData>('build_index', { courseDirs })
    await writeText(outFile, JSON.stringify(index, null, 2))
    return index
  }
  return buildIndexLocal(courseDirs, outFile)
}
