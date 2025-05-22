import React, { useEffect, useRef, useState } from 'react'
import LessonFlow, { LessonQuestion } from '../components/LessonFlow'
import MixedQuizPlayer from '../components/MixedQuizPlayer'
import { getQueue, popTask, runScheduler } from '../schedule'
import { loadMarkdown, loadYaml } from '../loaders'
import { assembleMixedQuiz, MixedQuestion } from '../mixedQuiz'
import { updateMastery, MasteryEntry, SkillMeta } from '../updateMastery'
import { awardXpAndSave, Prefs, XpLog } from '../awardXp'
import * as YAML from 'js-yaml'

const TOTAL = 15

export default function Learning() {
  const queue = getQueue()

  // simple in-memory state for demo purposes
  const mastery = useRef<Record<string, MasteryEntry>>({
    ['EA:' + 'A' + 'S001']: {
      status: 'unseen',
      s: 0,
      d: 0,
      r: 0,
      l: 0,
      next_due: new Date().toISOString(),
      next_q_index: 0
    }
  }).current

  const skills: Record<string, SkillMeta> = {
    ['EA:' + 'A' + 'S001']: { id: 'EA:' + 'A' + 'S001', topic: 'EA:T001' }
  }

  const prefs = useRef<Prefs>({
    format: 'Prefs-v2',
    profile: 'save',
    xp_since_mixed_quiz: 0,
    last_as: null,
    ui_theme: 'default'
  }).current

  const xp = useRef<XpLog>({ format: 'XP-v1', log: [] }).current
  const dist = {}

  useEffect(() => {
    runScheduler(skills, mastery, prefs, xp, dist)
  }, [])

  const task = queue[0]

  const [lesson, setLesson] = useState<{
    exposition: string
    question: LessonQuestion
  } | null>(null)
  const [quiz, setQuiz] = useState<MixedQuestion[] | null>(null)

  useEffect(() => {
    if (!task) return
    async function load() {
      if (task.kind === 'mixed_quiz') {
        const yamlText = await loadYaml('course/ea/as_questions/' + 'A' + 'S001.yaml')
        const data: any = YAML.load(yamlText)
        const pools = { ['EA:' + 'A' + 'S001']: { pool: data.pool } }
        setQuiz(assembleMixedQuiz(mastery, pools, xp, TOTAL))
      } else {
        const [courseId, skillId] = task.id.split(':')
        const md = await loadMarkdown(`course/${courseId}/as_md/${skillId}.md`)
        const yamlText = await loadYaml(`course/${courseId}/as_questions/${skillId}.yaml`)
        const data: any = YAML.load(yamlText)
        setLesson({ exposition: md, question: data.pool[0] })
      }
    }
    load()
  }, [task])

  const handleGrade = async (grade: number) => {
    if (!task || task.kind === 'mixed_quiz' || !lesson) return
    updateMastery(mastery, skills[task.id], grade, 1)
    await awardXpAndSave({ xp, prefs, autosave: async () => {} } as any, 10, `${task.id}_q1`)
    prefs.last_as = task.id
    popTask()
    runScheduler(skills, mastery, prefs, xp, dist)
  }

  if (!task) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Learning</h2>
        <p>No tasks available.</p>
      </div>
    )
  }

  if (task.kind === 'mixed_quiz' && quiz) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Learning</h2>
        <MixedQuizPlayer current={1} total={quiz.length}>
          <p>Quiz in progress...</p>
        </MixedQuizPlayer>
      </div>
    )
  }

  if (lesson) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Learning</h2>
        <LessonFlow exposition={lesson.exposition} question={lesson.question} onGrade={handleGrade} />
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Learning</h2>
      <p>Loading...</p>
    </div>
  )
}
