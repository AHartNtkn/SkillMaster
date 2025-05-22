import { render, screen } from '@testing-library/react'
import React from 'react'
import Markdown from './Markdown'

describe('Markdown sanitisation', () => {
  it('removes script tags', () => {
    render(<Markdown>{'hello <script>evil()</script>'}</Markdown>)
    const div = screen.getByText('hello', { exact: false })
    expect(div.innerHTML).not.toMatch(/script/)
  })
})
