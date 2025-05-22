import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './i18n.tsx'
import { ThemeProvider } from './theme.tsx'
import { Provider } from 'react-redux'
import { store } from './store'
import { ToastProvider } from './Toast'
import { SaveManagerProvider } from './saveContext'
import { initSave } from './initSave'
import { init } from './init'
import 'mathjax/es5/tex-mml-chtml.js'

async function bootstrap() {
  await init(store)
  const manager = await initSave(store)
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Provider store={store}>
        <I18nProvider>
          <ThemeProvider>
            <ToastProvider>
              <SaveManagerProvider manager={manager}>
                <App />
              </SaveManagerProvider>
            </ToastProvider>
          </ThemeProvider>
        </I18nProvider>
      </Provider>
    </StrictMode>,
  )
}

bootstrap()

