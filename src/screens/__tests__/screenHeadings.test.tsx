import { render, screen } from '@testing-library/react'
import Home from '../Home'
import Learning from '../Learning'
import Progress from '../Progress'
import Library from '../Library'
import Settings from '../Settings'

describe('screen headings match mockup', () => {
  it('home screen shows Dashboard heading', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
  })

  it('learning screen shows Learning heading', () => {
    render(<Learning />)
    expect(screen.getByRole('heading', { name: /learning/i })).toBeInTheDocument()
  })

  it('progress screen shows Progress Graph heading', () => {
    render(<Progress />)
    expect(screen.getByRole('heading', { name: /progress graph/i })).toBeInTheDocument()
  })

  it('library screen shows Course Library heading', () => {
    render(<Library />)
    expect(screen.getByRole('heading', { name: /course library/i })).toBeInTheDocument()
  })

  it('settings screen shows Settings heading', () => {
    render(<Settings />)
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument()
  })
})
