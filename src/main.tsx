import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { I18nProvider } from './i18n.tsx';
import { ThemeProvider } from './theme.tsx';
import { Provider } from 'react-redux'
import { store } from './store'
import { boot } from './boot'

boot()
import 'mathjax/es5/tex-mml-chtml.js';

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
);
