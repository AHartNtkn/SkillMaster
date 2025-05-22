import React, { useState } from 'react'
import Markdown from '../Markdown'
import { useI18n } from '../i18n'

export interface LessonQuestion {
  stem: string
  choices: string[]
  correct: number
  solution?: string
}

export interface LessonFlowProps {
  exposition: string
  question: LessonQuestion
  onGrade?: (grade: number) => void
}

export default function LessonFlow({ exposition, question, onGrade }: LessonFlowProps) {
  const strings = useI18n()
  const [phase, setPhase] = useState<'exposition' | 'question' | 'feedback'>('exposition')
  const [selected, setSelected] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const start = () => setPhase('question')

  const submit = () => {
    if (selected === null) return
    setIsCorrect(selected === question.correct)
    setPhase('feedback')
  }

  const rate = (grade: number) => {
    onGrade?.(grade)
  }

  return (
    <div className="space-y-4">
      {phase === 'exposition' && (
        <div>
          <Markdown>{exposition}</Markdown>
          <button onClick={start} className="mt-4 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg">
            {strings.start_questions}
          </button>
        </div>
      )}

      {phase === 'question' && (
        <div>
          <Markdown>{question.stem}</Markdown>
          <div className="space-y-3 mt-2">
            {question.choices.map((c, idx) => (
              <button
                key={idx}
                className={`w-full text-left p-3 rounded-lg border border-gray-300 transition-colors ${selected===idx?'bg-blue-200':'bg-gray-100 hover:bg-gray-200'}`}
                onClick={() => setSelected(idx)}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            onClick={submit}
            disabled={selected === null}
            className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {strings.submit_answer}
          </button>
        </div>
      )}

      {phase === 'feedback' && (
        <div>
          <h3 className="text-xl font-semibold mb-2">
            {isCorrect ? strings.correct : strings.incorrect}
          </h3>
          {question.solution && <Markdown>{question.solution}</Markdown>}
          <div className="flex space-x-2 mt-4">
            <button onClick={() => rate(2)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm">
              {strings.again}
            </button>
            <button onClick={() => rate(3)} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded-lg text-sm">
              {strings.hard}
            </button>
            <button onClick={() => rate(4)} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-3 rounded-lg text-sm">
              {strings.okay}
            </button>
            <button onClick={() => rate(5)} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm">
              {strings.easy}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
