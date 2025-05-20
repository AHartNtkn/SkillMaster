import React, { useState } from 'react';
import CourseLibrary from './CourseLibrary';

export default function App() {
  const [screen, setScreen] = useState<'home' | 'library'>('home');
  return (
    <div style={{ padding: '1rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Skill Mastery</h1>
      <nav style={{ margin: '1rem 0' }}>
        <button onClick={() => setScreen('home')} style={{ marginRight: '1rem' }}>
          Home
        </button>
        <button onClick={() => setScreen('library')}>Course Library</button>
      </nav>
      {screen === 'home' && (
        <p>
          Initial prototype. Refer to the <a href="docs/mockup.html" target="_blank" rel="noopener">mockup</a>.
        </p>
      )}
      {screen === 'library' && <CourseLibrary />}
    </div>
  );
}
