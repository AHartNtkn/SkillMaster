import { render, screen, fireEvent } from '@testing-library/react'
import App from '../../App'
import { I18nProvider } from '../../i18n'
import { ThemeProvider } from '../../theme'

describe('navigation between screens', () => {
  function setup() {
    render(
      <I18nProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </I18nProvider>
    )
  }

  it('navigates through all tabs', () => {
    setup()
    // starts on Home
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /learning/i }))
    expect(screen.getByRole('heading', { name: /learning/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /progress/i }))
    expect(screen.getByRole('heading', { name: /progress graph/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /library/i }))
    expect(screen.getByRole('heading', { name: /course library/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument()
  })
})
