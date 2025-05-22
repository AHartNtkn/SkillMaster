import React from 'react'
import { useI18n } from '../i18n'

export interface XpProgressProps {
  current: number
  threshold: number
}

export default function XpProgress({ current, threshold }: XpProgressProps) {
  const strings = useI18n()
  const pct = Math.min(100, Math.round((current / threshold) * 100))
  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-1 text-sm text-gray-600">
        <span>{strings.xp_progress}</span>
        <span>
          {current} / {threshold} XP
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className="bg-green-500 h-4 rounded-full"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-1 text-center">
        {strings.next_mixed_quiz} {threshold} XP
      </p>
    </div>
  )
}
