export interface ForceNode {
  id: string
  x?: number
  y?: number
}

export interface ForceLink {
  source: number
  target: number
  distance: number
}

export function simpleForceLayout(
  nodes: ForceNode[],
  links: ForceLink[],
  width: number,
  height: number,
  iterations: number = 100,
) {
  const pos = nodes.map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
  }))

  const k = Math.sqrt(width * height) / nodes.length

  for (let iter = 0; iter < iterations; iter++) {
    // repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        let dx = pos[j].x - pos[i].x
        let dy = pos[j].y - pos[i].y
        let dist = Math.sqrt(dx * dx + dy * dy) || 1
        const rep = (k * k) / dist / dist
        pos[i].x -= rep * dx
        pos[i].y -= rep * dy
        pos[j].x += rep * dx
        pos[j].y += rep * dy
      }
    }
    // attraction
    for (const link of links) {
      const s = link.source
      const t = link.target
      let dx = pos[t].x - pos[s].x
      let dy = pos[t].y - pos[s].y
      let dist = Math.sqrt(dx * dx + dy * dy) || 1
      const force = (dist - link.distance * k) / dist * 0.1
      pos[s].x += force * dx
      pos[s].y += force * dy
      pos[t].x -= force * dx
      pos[t].y -= force * dy
    }
    // keep within bounds
    for (const p of pos) {
      p.x = Math.max(0, Math.min(width, p.x))
      p.y = Math.max(0, Math.min(height, p.y))
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    nodes[i].x = pos[i].x
    nodes[i].y = pos[i].y
  }
}
