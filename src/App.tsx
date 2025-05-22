import { useState } from 'react';
import './App.css';
import { useI18n } from './i18n.tsx';
import { useTheme } from './theme.tsx';
import useExternalLinks from './useExternalLinks.tsx';
import Home from './screens/Home.tsx';
import Learning from './screens/Learning.tsx';
import Progress from './screens/Progress.tsx';
import Library from './screens/Library.tsx';
import Settings from './screens/Settings.tsx';

type Screen = 'home' | 'learning' | 'progress' | 'library' | 'settings';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const { toggle } = useTheme();
  const strings = useI18n();
  useExternalLinks();

  const renderScreen = () => {
    switch (screen) {
      case 'learning':
        return <Learning />;
      case 'progress':
        return <Progress />;
      case 'library':
        return <Library />;
      case 'settings':
        return <Settings />;
      default:
        return <Home />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '1rem', borderBottom: '1px solid #ccc', textAlign: 'center', fontWeight: 'bold' }}>
        {strings.title}
      </header>
      <main style={{ flexGrow: 1 }}>{renderScreen()}</main>
      <nav style={{ borderTop: '1px solid #ccc', display: 'flex', justifyContent: 'space-around', padding: '0.5rem', background: '#f0f0f0' }}>
        <button onClick={() => setScreen('home')} style={{ fontWeight: screen === 'home' ? 'bold' as const : 'normal' }}>{strings.home}</button>
        <button onClick={() => setScreen('learning')} style={{ fontWeight: screen === 'learning' ? 'bold' as const : 'normal' }}>{strings.learning}</button>
        <button onClick={() => setScreen('progress')} style={{ fontWeight: screen === 'progress' ? 'bold' as const : 'normal' }}>{strings.progress}</button>
        <button onClick={() => setScreen('library')} style={{ fontWeight: screen === 'library' ? 'bold' as const : 'normal' }}>{strings.library}</button>
        <button onClick={() => setScreen('settings')} style={{ fontWeight: screen === 'settings' ? 'bold' as const : 'normal' }}>{strings.settings}</button>
      </nav>
      <button style={{ margin: '0.5rem' }} onClick={toggle}>{strings.toggle_dark_mode}</button>
    </div>
  );
}
