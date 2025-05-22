import { render, screen } from '@testing-library/react'
import React from 'react'
import InlineMath from './InlineMath'

describe('InlineMath accessibility', () => {
  it('adds aria-label with TeX source', () => {
    render(<InlineMath>{'\\frac{a}{b}'}</InlineMath>)
    const span = screen.getByText(/\\frac{a}{b}/)
    expect(span).toHaveAttribute('aria-label', '\\frac{a}{b}')
  })
})
