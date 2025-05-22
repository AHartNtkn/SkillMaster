import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { promises as fs } from 'fs'
import path from 'path'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './i18n.tsx'
import { ThemeProvider } from './theme.tsx'
import 'mathjax/es5/tex-mml-chtml.js'
import { SaveManager } from './saveManager'
import { createAppStore } from './store'

async function start() {
  const prefsRaw = await fs.readFile(path.join('save', 'prefs.json'), 'utf8')
  const prefs = JSON.parse(prefsRaw) as { profile: string }
  const manager = new SaveManager(prefs.profile)
  await manager.load()
  const store = createAppStore(manager)

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Provider store={store}>
        <I18nProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </I18nProvider>
      </Provider>
    </StrictMode>,
  )
}

start()
