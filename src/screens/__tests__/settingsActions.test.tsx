import { render, screen, fireEvent } from '@testing-library/react'
import Settings from '../Settings'
import { SaveManagerProvider } from '../../saveContext'
import React from 'react'

function setup(manager: any) {
  render(
    <SaveManagerProvider manager={manager}>
      <Settings />
    </SaveManagerProvider>
  )
}

describe('settings actions', () => {
  it('calls export/import/reset', () => {
    const manager = {
      exportProgress: vi.fn(),
      importProgress: vi.fn(),
      resetProfile: vi.fn(),
    }
    vi.spyOn(window, 'prompt').mockReturnValue('tmp.zip')
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    setup(manager)
    fireEvent.click(screen.getByRole('button', { name: /import progress/i }))
    expect(manager.importProgress).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /export progress/i }))
    expect(manager.exportProgress).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /reset profile/i }))
    expect(manager.resetProfile).toHaveBeenCalled()
  })
})
