import { describe, it, expect } from 'vitest'
import { DistanceMatrix, Adjacency } from './distanceMatrix'

const graph: Adjacency = {
  A: ['B', 'D'],
  B: ['A', 'C'],
  C: ['B'],
  D: ['A']
}

describe('DistanceMatrix', () => {
  it('computes bfs distance and caches within limit', () => {
    const dm = new DistanceMatrix(graph, 3)
    expect(dm.getDistance('A', 'C')).toBe(2)
    expect(dm.matrix['A']['C']).toBe(2)
    expect(Object.keys(dm.matrix).length).toBeLessThanOrEqual(3)
  })

  it('does not cache when limit exceeded', () => {
    const dm = new DistanceMatrix(graph, 2)
    dm.getDistance('A', 'B')
    dm.getDistance('A', 'C')
    expect(dm.matrix['A']['B']).toBe(1)
    expect(dm.matrix['A']['C']).toBeUndefined()
  })

  it('returns undefined when nodes disconnected', () => {
    const dm = new DistanceMatrix(graph, 3)
    expect(dm.getDistance('A', 'Z')).toBeUndefined()
  })
})
