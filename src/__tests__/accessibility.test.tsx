import { render, screen } from '@testing-library/react'
import App from '../App'
import { I18nProvider } from '../i18n'
import { ThemeProvider } from '../theme'

describe('accessibility', () => {
  function setup() {
    render(
      <I18nProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </I18nProvider>
    )
  }

  it('navigation buttons are focusable', () => {
    setup()
    const labels = [/home/i, /learning/i, /progress/i, /library/i, /settings/i]
    for (const label of labels) {
      const btn = screen.getByRole('button', { name: label }) as HTMLButtonElement
      expect(btn.tabIndex).toBeGreaterThanOrEqual(0)
    }
  })
})
