import React, { useEffect, useRef, useState } from 'react'
import { simpleForceLayout, ForceNode, ForceLink } from '../simpleForce'

interface Topic {
  id: string
  name: string
  skills: string[]
  status: 'unseen' | 'in_progress' | 'mastered' | 'overdue'
}

const TOPICS: Topic[] = [
  {
    id: 'EA:T001',
    name: 'Number Sense & Counting',
    skills: ['EA:' + 'A' + 'S001', 'EA:' + 'A' + 'S003', 'EA:' + 'A' + 'S004'],
    status: 'in_progress',
  },
  {
    id: 'EA:T002',
    name: 'Basic Addition',
    skills: ['EA:' + 'A' + 'S013'],
    status: 'unseen',
  },
]

const TOPIC_DIST: Record<string, Record<string, number>> = {
  'EA:T001': { 'EA:T002': 1 },
  'EA:T002': { 'EA:T001': 1 },
}

export default function Progress() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [nodes, setNodes] = useState<ForceNode[]>([])
  const [selected, setSelected] = useState<Topic | null>(null)

  useEffect(() => {
    const width = 300
    const height = 300
    const ns: ForceNode[] = TOPICS.map(t => ({ id: t.id }))
    const links: ForceLink[] = []
    for (let i = 0; i < TOPICS.length; i++) {
      for (let j = i + 1; j < TOPICS.length; j++) {
        const d = TOPIC_DIST[TOPICS[i].id]?.[TOPICS[j].id]
        if (d !== undefined) {
          links.push({ source: i, target: j, distance: d })
        }
      }
    }
    simpleForceLayout(ns, links, width, height)
    setNodes(ns)
  }, [])

  const colorFor = (t: Topic) => {
    switch (t.status) {
      case 'in_progress':
        return 'fill-blue-500'
      case 'mastered':
        return 'fill-green-500'
      case 'overdue':
        return 'fill-red-500'
      default:
        return 'fill-gray-400'
    }
  }

  return (
    <div className="p-4 text-center">
      <h2 className="text-2xl font-bold mb-4">Progress Graph</h2>
      <svg ref={svgRef} width={300} height={300} className="mx-auto bg-gray-200 rounded-lg">
        {nodes.map((n, idx) => (
          <circle
            key={n.id}
            cx={n.x}
            cy={n.y}
            r={10 + TOPICS[idx].skills.length * 2}
            className={colorFor(TOPICS[idx])}
            role="button"
            aria-label={TOPICS[idx].name}
            onClick={() => setSelected(TOPICS[idx])}
          />
        ))}
      </svg>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-gray-400 mr-2"></span>Unseen</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>In Progress</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>Mastered</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>Overdue</div>
      </div>
      {selected && (
        <div className="mt-4" data-testid="skill-list">
          <h3 className="font-semibold mb-2">{selected.name}</h3>
          <ul className="list-disc list-inside">
            {selected.skills.map(s => (
              <li key={s} className="mb-1">
                {s}{' '}
                <button
                  className="text-blue-600 underline"
                  onClick={() => console.log('Start lesson for', s)}
                >
                  Start Lesson
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
