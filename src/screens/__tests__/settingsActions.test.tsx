import { render, screen, fireEvent } from '@testing-library/react'
import Settings from '../Settings'
import { I18nProvider } from '../../i18n'
import { vi } from 'vitest'

vi.mock('../../saveManagerSetup', () => ({
  saveManager: {
    exportProgress: vi.fn(),
    importProgress: vi.fn(),
    resetProfile: vi.fn(),
  }
}))
import { saveManager } from '../../saveManagerSetup'

describe('settings actions', () => {
  it('calls SaveManager methods', () => {
    render(
      <I18nProvider>
        <Settings />
      </I18nProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: /export progress/i }))
    expect(saveManager.exportProgress).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /import progress/i }))
    expect(saveManager.importProgress).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /reset profile/i }))
    expect(saveManager.resetProfile).toHaveBeenCalled()
  })
})
