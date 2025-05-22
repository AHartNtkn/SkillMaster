export interface Adjacency {
  [node: string]: string[]
}

export interface DistMatrix {
  [src: string]: Record<string, number>
}

export class DistanceMatrix {
  matrix: DistMatrix = {}
  private nodes = new Set<string>()

  constructor(private graph: Adjacency, private limit = 1000) {}

  private store(a: string, b: string, d: number) {
    if (!this.matrix[a]) this.matrix[a] = {}
    if (!this.matrix[b]) this.matrix[b] = {}
    this.matrix[a][b] = d
    this.matrix[b][a] = d
    this.nodes.add(a)
    this.nodes.add(b)
  }

  private bfs(a: string, b: string): number | undefined {
    if (a === b) return 0
    const visited = new Set<string>([a])
    const queue: Array<{ n: string; d: number }> = [{ n: a, d: 0 }]
    while (queue.length) {
      const { n, d } = queue.shift()!
      for (const nbr of this.graph[n] || []) {
        if (nbr === b) return d + 1
        if (!visited.has(nbr)) {
          visited.add(nbr)
          queue.push({ n: nbr, d: d + 1 })
        }
      }
    }
    return undefined
  }

  getDistance(a: string, b: string): number | undefined {
    const cached = this.matrix[a]?.[b]
    if (cached !== undefined) return cached
    const dist = this.bfs(a, b)
    if (dist === undefined) return undefined
    const newNodes = [a, b].filter((n) => !this.nodes.has(n))
    if (this.nodes.size + newNodes.length <= this.limit) {
      this.store(a, b, dist)
    }
    return dist
  }
}
