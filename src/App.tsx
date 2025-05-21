import React, { useEffect, useState } from 'react';
import CourseLibrary from './CourseLibrary';
import {
  loadCourses,
  loadCatalog,
  loadTopic,
  loadMarkdown,
  loadQuestions
} from './courseLoader';
import { Prefs, loadPrefs, savePrefs } from './prefs';

interface Question {
  stem: string;
  choices: string[];
  correct: number;
  explanation: string;
}

type Screen = 'home' | 'learning' | 'progress' | 'library' | 'settings';
type Phase = 'exposition' | 'question' | 'feedback';

export default function App() {
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [screen, setScreen] = useState<Screen>('home');
  const [phase, setPhase] = useState<Phase>('exposition');
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ msg: string; onConfirm: () => void } | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentAs, setCurrentAs] = useState<string | null>(null);

  const dark = prefs.ui_theme === 'dark';

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  async function startLearning() {
    setScreen('learning');
    setPhase('exposition');
    setCurrentQ(0);
    setSelected(null);
    setLoading(true);
    const courses = await loadCourses();
    if (courses.length > 0) {
      const course = courses[0];
      const catalog = await loadCatalog(course.path);
      if (catalog && catalog.entry_topics.length > 0) {
        const topic = await loadTopic(course.path, catalog.entry_topics[0]);
        if (topic && topic.ass.length > 0) {
          const asId = topic.ass[0];
          setCurrentAs(asId);
          const md = await loadMarkdown(course.path, asId);
          const qsRaw = await loadQuestions(course.path, asId);
          setMarkdown(md);
          setQuestions(
            qsRaw.map(q => ({
              stem: q.stem,
              choices: q.choices,
              correct: q.correct,
              explanation: q.solution || ''
            }))
          );
        }
      }
    }
    setLoading(false);
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
    if (next < questions.length) {
      setCurrentQ(next);
      setPhase('question');
      setSelected(null);
    } else {
      setAlertMsg('Skill complete!');
      exitLearning();
    }
  }

  function exitLearning() {
    if (currentAs) {
      setPrefs(p => ({ ...p, last_as: currentAs }));
    }
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
                Question {currentQ + 1} of {questions.length}
              </span>
            </div>
            {phase === 'exposition' && (
              <div>
                {loading ? (
                  <p>Loading...</p>
                ) : (
                  <>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{markdown}</pre>
                    <button onClick={startQuestions}>Start Questions</button>
                  </>
                )}
              </div>
            )}
            {phase === 'question' && (
              <div>
                <p>{questions[currentQ].stem}</p>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {questions[currentQ].choices.map((c, i) => (
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
                {selected === questions[currentQ].correct ? (
                  <p style={{ color: 'green' }}>Correct!</p>
                ) : (
                  <p style={{ color: 'red' }}>Incorrect.</p>
                )}
                <p>{questions[currentQ].explanation}</p>
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
              <input
                type="checkbox"
                checked={dark}
                onChange={() =>
                  setPrefs(p => ({ ...p, ui_theme: dark ? 'default' : 'dark' }))
                }
              />
              Dark Mode
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
