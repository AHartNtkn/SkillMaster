import { render, screen, fireEvent } from '@testing-library/react'
import App from '../../App'
import { SaveManagerProvider } from '../../saveContext'
import { SaveManager } from '../../saveManager'
import { I18nProvider } from '../../i18n'
import { ThemeProvider } from '../../theme'
import { Provider } from 'react-redux'
import { createAppStore } from '../../store'

describe('navigation between screens', () => {
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
