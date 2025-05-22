import React, { useEffect } from 'react'
import DOMPurify from 'dompurify'

export interface MarkdownProps {
  children: string
}

// very small subset markdown -> html
function mdToHtml(md: string): string {
  let html = md
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n+/g, '</p><p>')
  return `<p>${html}</p>`
}

export default function Markdown({ children }: MarkdownProps) {
  const sanitized = DOMPurify.sanitize(mdToHtml(children))

  useEffect(() => {
    // trigger MathJax typesetting if available
    ;(window as any).MathJax?.typeset?.()
  }, [sanitized])

  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />
}
