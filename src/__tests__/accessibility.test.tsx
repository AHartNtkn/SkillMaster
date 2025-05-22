import { render, screen } from '@testing-library/react'
import App from '../App'
import { I18nProvider } from '../i18n'
import { ThemeProvider } from '../theme'
import { Provider } from 'react-redux'
import { createAppStore } from '../store'
import { SaveManagerProvider } from '../saveContext'
import { SaveManager } from '../saveManager'

describe('accessibility', () => {
  function setup() {
    const store = createAppStore()
    const manager = new SaveManager('.') as any
    render(
      <Provider store={store}>
        <I18nProvider>
          <ThemeProvider>
            <SaveManagerProvider manager={manager}>
              <App />
            </SaveManagerProvider>
          </ThemeProvider>
        </I18nProvider>
      </Provider>
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
