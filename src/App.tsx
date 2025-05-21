import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { useI18n } from './i18n.tsx';
import { useTheme } from './theme.tsx';

function App() {
  const [count, setCount] = useState(0);
  const { toggle } = useTheme();
  const strings = useI18n();

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>{strings.title}</h1>
      <div className="card">
        <button onClick={() => setCount((c) => c + 1)}>count is {count}</button>
        <p>Edit <code>src/App.tsx</code> and save to test HMR</p>
      </div>
      <button onClick={toggle}>{strings.toggle_dark_mode}</button>
    </>
  );
}

export default App;
