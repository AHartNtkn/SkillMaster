import { render, screen, fireEvent } from '@testing-library/react'
import Progress from '../Progress'

describe('Progress graph interactions', () => {
  it('shows skills when topic clicked', () => {
    render(<Progress />)
    const node = screen.getByRole('button', { name: /Number Sense/i })
    fireEvent.click(node)
    expect(screen.getByTestId('skill-list')).toBeInTheDocument()
    expect(screen.getByText('EA:' + 'A' + 'S001')).toBeInTheDocument()
  })
})
