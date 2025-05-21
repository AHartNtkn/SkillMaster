import React, { useEffect, useState } from 'react';
import CourseLibrary from './CourseLibrary';

// Simple question data used by the learning mock
interface Question {
  stem: string;
  choices: string[];
  correct: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    stem: 'Solve the equation: x^2 - 7x + 10 = 0',
    choices: ['x = 1, x = 10', 'x = 2, x = 5', 'x = -2, x = -5', 'x = -1, x = -10'],
    correct: 1,
    explanation:
      'To solve x^2 - 7x + 10 = 0, factor as (x-2)(x-5)=0 giving x=2 or x=5.'
  },
  {
    stem: 'Which numeral represents five?',
    choices: ['5', '3', '1', '7'],
    correct: 0,
    explanation: 'The numeral 5 corresponds to the number five.'
  },
  {
    stem: 'Which numeral represents nine?',
    choices: ['9', '8', '7', '6'],
    correct: 0,
    explanation: 'The numeral 9 represents nine.'
  }
];

type Screen = 'home' | 'learning' | 'progress' | 'library' | 'settings';
type Phase = 'exposition' | 'question' | 'feedback';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [phase, setPhase] = useState<Phase>('exposition');
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ msg: string; onConfirm: () => void } | null>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
  }, [dark]);

  function startLearning() {
    setScreen('learning');
    setPhase('exposition');
    setCurrentQ(0);
    setSelected(null);
  }

  function startQuestions() {
    setPhase('question');
    setSelected(null);
  }

  function selectAnswer(i: number) {
    setSelected(i);
  }

  function submitAnswer() {
    if (selected === null) return;
    setPhase('feedback');
  }

  function rateAnswer() {
    nextQuestion();
  }

  function nextQuestion() {
    const next = currentQ + 1;
    if (next < QUESTIONS.length) {
      setCurrentQ(next);
      setPhase('question');
      setSelected(null);
    } else {
      setAlertMsg('Skill complete!');
      exitLearning();
    }
  }

  function exitLearning() {
    setScreen('home');
    setPhase('exposition');
    setCurrentQ(0);
    setSelected(null);
  }

  function confirmExit() {
    setConfirm({
      msg: 'Are you sure you want to exit to Home? Progress on the current question will not be saved.',
      onConfirm: () => {
        exitLearning();
        setConfirm(null);
      }
    });
  }

  return (
    <div className="app">
      <header>Skill Mastery</header>
      <div className="content">
        {screen === 'home' && (
          <div>
            <h2>Dashboard</h2>
            <p>5 Skills Due for Review</p>
            <button onClick={startLearning}>Start Next Skill</button>
          </div>
        )}
        {screen === 'learning' && (
          <div>
            <div style={{ marginBottom: '0.5rem' }}>
              <button onClick={confirmExit}>Exit</button>
              <span style={{ marginLeft: '1rem' }}>
                Question {currentQ + 1} of {QUESTIONS.length}
              </span>
            </div>
            {phase === 'exposition' && (
              <div>
                <p>Welcome to the lesson on solving quadratics by factoring.</p>
                <button onClick={startQuestions}>Start Questions</button>
              </div>
            )}
            {phase === 'question' && (
              <div>
                <p>{QUESTIONS[currentQ].stem}</p>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {QUESTIONS[currentQ].choices.map((c, i) => (
                    <li key={i} style={{ marginBottom: '0.5rem' }}>
                      <button
                        onClick={() => selectAnswer(i)}
                        style={{
                          width: '100%',
                          background: selected === i ? '#bfdbfe' : '#f3f4f6',
                          border: '1px solid #ccc',
                          padding: '0.5rem',
                          cursor: 'pointer'
                        }}
                      >
                        {c}
                      </button>
                    </li>
                  ))}
                </ul>
                <button onClick={submitAnswer} disabled={selected === null}>
                  Submit Answer
                </button>
              </div>
            )}
            {phase === 'feedback' && (
              <div>
                {selected === QUESTIONS[currentQ].correct ? (
                  <p style={{ color: 'green' }}>Correct!</p>
                ) : (
                  <p style={{ color: 'red' }}>Incorrect.</p>
                )}
                <p>{QUESTIONS[currentQ].explanation}</p>
                <div style={{ margin: '0.5rem 0' }}>
                  <button onClick={rateAnswer}>Next Question</button>
                </div>
              </div>
            )}
          </div>
        )}
        {screen === 'progress' && <p>Progress graph placeholder</p>}
        {screen === 'library' && <CourseLibrary />}
        {screen === 'settings' && (
          <div>
            <label>
              <input type="checkbox" checked={dark} onChange={() => setDark(!dark)} /> Dark Mode
            </label>
          </div>
        )}
      </div>
      <footer>
        <div className={`tab ${screen === 'home' ? 'active' : ''}`} onClick={() => setScreen('home')}>
          Home
        </div>
        <div className={`tab ${screen === 'progress' ? 'active' : ''}`} onClick={() => setScreen('progress')}>
          Progress
        </div>
        <div className={`tab ${screen === 'library' ? 'active' : ''}`} onClick={() => setScreen('library')}>
          Library
        </div>
        <div className={`tab ${screen === 'settings' ? 'active' : ''}`} onClick={() => setScreen('settings')}>
          Settings
        </div>
      </footer>
      {alertMsg && (
        <div className="alert-modal" style={modalStyles}>
          <div style={modalInnerStyles}>
            <p>{alertMsg}</p>
            <button onClick={() => setAlertMsg(null)}>OK</button>
          </div>
        </div>
      )}
      {confirm && (
        <div className="confirm-modal" style={modalStyles}>
          <div style={modalInnerStyles}>
            <p>{confirm.msg}</p>
            <button onClick={confirm.onConfirm} style={{ marginRight: '0.5rem' }}>
              Yes
            </button>
            <button onClick={() => setConfirm(null)}>No</button>
          </div>
        </div>
      )}
    </div>
  );
}

const modalStyles: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const modalInnerStyles: React.CSSProperties = {
  background: 'white',
  padding: '1rem',
  borderRadius: '4px',
  maxWidth: '300px',
  textAlign: 'center'
};
