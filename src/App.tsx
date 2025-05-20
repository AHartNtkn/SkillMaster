import React, { useState, useEffect } from 'react';
import CourseLibrary from './CourseLibrary';

const sampleQuestion = {
  stem: 'Solve x^2 - 7x + 10 = 0',
  choices: [
    'x = 1, x = 10',
    'x = 2, x = 5',
    'x = -2, x = -5',
    'x = -1, x = -10',
  ],
  correct: 1,
  solution: 'The correct answer is x = 2 or x = 5.',
};

export default function App() {
  type Screen = 'home' | 'learn' | 'progress' | 'library' | 'settings';
  const [screen, setScreen] = useState<Screen>('home');
  const [answer, setAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  function submit() {
    if (answer !== null) setShowFeedback(true);
  }

  function resetLearn() {
    setAnswer(null);
    setShowFeedback(false);
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white shadow-xl rounded-lg flex flex-col h-screen" id="main-app-container">
      <div className="flex-grow overflow-y-auto p-4" id="content-area">
        {screen === 'home' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Dashboard</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setScreen('learn')}>Start Next Skill</button>
          </div>
        )}

        {screen === 'learn' && (
          <div className="space-y-4">
            <button className="text-sm underline" onClick={() => setShowExplanation(true)}>Review Explanation</button>
            {showExplanation && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" onClick={() => setShowExplanation(false)}>
                <div className="bg-white p-4 rounded" onClick={e => e.stopPropagation()}>
                  <p>Example explanation text.</p>
                </div>
              </div>
            )}
            {!showFeedback && (
              <div className="space-y-2">
                <p>{sampleQuestion.stem}</p>
                {sampleQuestion.choices.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setAnswer(i)}
                    className={`block w-full text-left p-2 border rounded ${answer === i ? 'bg-blue-200' : ''}`}
                  >
                    {c}
                  </button>
                ))}
                <button className="bg-blue-600 text-white px-4 py-2 rounded mt-2" disabled={answer === null} onClick={submit}>
                  Submit
                </button>
              </div>
            )}
            {showFeedback && (
              <div className="space-y-2">
                <p className="font-semibold">{answer === sampleQuestion.correct ? 'Correct!' : 'Incorrect.'}</p>
                <p>{sampleQuestion.solution}</p>
                <button className="bg-gray-700 text-white px-4 py-2 rounded" onClick={() => { setScreen('home'); resetLearn(); }}>
                  Done
                </button>
              </div>
            )}
          </div>
        )}

        {screen === 'progress' && <p>Progress screen placeholder.</p>}
        {screen === 'library' && <CourseLibrary />}
        {screen === 'settings' && (
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
            <span>Dark Mode</span>
          </label>
        )}
      </div>
      <div className="flex justify-around border-t" id="tab-bar">
        <button onClick={() => { setScreen('home'); resetLearn(); }} className={`flex-1 p-2 ${screen === 'home' ? 'tab-active' : 'tab-inactive'}`}>Home</button>
        <button onClick={() => { setScreen('progress'); resetLearn(); }} className={`flex-1 p-2 ${screen === 'progress' ? 'tab-active' : 'tab-inactive'}`}>Progress</button>
        <button onClick={() => { setScreen('library'); resetLearn(); }} className={`flex-1 p-2 ${screen === 'library' ? 'tab-active' : 'tab-inactive'}`}>Library</button>
        <button onClick={() => { setScreen('settings'); resetLearn(); }} className={`flex-1 p-2 ${screen === 'settings' ? 'tab-active' : 'tab-inactive'}`}>Settings</button>
      </div>
    </div>
  );
}
