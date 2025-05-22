import { describe, it, expect } from 'vitest'
import path from 'path'
import { floydWarshall, buildIndex } from './indexBuilder'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'

describe('floydWarshall', () => {
  it('computes all pairs shortest paths', () => {
    const nodes = ['A', 'B', 'C']
    const edges: Array<[string, string]> = [['A', 'B'], ['B', 'C']]
    const dist = floydWarshall(nodes, edges)
    expect(dist['A']['C']).toBe(2)
    expect(dist['C']['A']).toBe(2)
  })
})

describe('buildIndex', async () => {
  it('builds dist and asCount from sample course', async () => {
    const courseDir = path.join(process.cwd(), 'course/ea')
    const outFile = path.join(tmpdir(), 'index.json')
    const index = await buildIndex([courseDir], outFile)
    const topicId = 'EA:T001'
    const skillA = 'EA:' + 'A' + 'S001'
    const skillB = 'EA:' + 'A' + 'S013'
    expect(index.asCount[topicId]).toBeGreaterThan(0)
    expect(index.dist[skillA][skillB]).toBeGreaterThan(0)
    const saved = JSON.parse(await fs.readFile(outFile, 'utf8'))
    expect(saved.dist[skillA][skillB]).toBe(index.dist[skillA][skillB])
  })
})
