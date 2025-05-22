import React from 'react'

export interface InlineMathProps {
  /** TeX expression without delimiters */
  children: string
}

/**
 * Renders inline math with an aria-label so that screen readers announce the raw expression.
 * MathJax will process the delimiters if present on the page.
 */
export default function InlineMath({ children }: InlineMathProps) {
  return <span aria-label={children}>{`\\(${children}\\)`}</span>
}
