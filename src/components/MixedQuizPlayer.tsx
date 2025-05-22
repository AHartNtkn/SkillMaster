import React from 'react'
import { useI18n } from '../i18n'

export interface MixedQuizPlayerProps {
  current: number
  total: number
  children?: React.ReactNode
}

export default function MixedQuizPlayer({ current, total, children }: MixedQuizPlayerProps) {
  const strings = useI18n()
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-3 rounded-lg shadow sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-gray-800">{strings.mixed_quiz}</h2>
        <p className="text-sm text-gray-600">
          {strings.question} {current} {strings.of} {total}
        </p>
      </div>
      {children}
    </div>
  )
}
