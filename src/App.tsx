import React, { useEffect, useState } from 'react';
import { fsrs, Rating, createEmptyCard, Card } from 'ts-fsrs';

const scheduler = fsrs();
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

interface Mastery {
  status: 'unseen' | 'in_progress' | 'mastered';
  card: Card;
  n: number;
  lastGrades: number[];
  next_q_index: number;
}

function loadMastery(asId: string): Mastery {
  const raw = localStorage.getItem(`mastery_${asId}`);
  if (!raw) {
    return {
      status: 'unseen',
      card: createEmptyCard(new Date()),
      n: 0,
      lastGrades: [],
      next_q_index: 0
    };
  }
  const obj = JSON.parse(raw);
  obj.card.due = new Date(obj.card.due);
  if (obj.card.last_review) obj.card.last_review = new Date(obj.card.last_review);
  return obj as Mastery;
}

function saveMastery(asId: string, m: Mastery) {
  localStorage.setItem(`mastery_${asId}`, JSON.stringify(m));
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
  const [asId, setAsId] = useState('');
  const [mastery, setMastery] = useState<Mastery | null>(null);

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
          const as = topic.ass[0];
          setAsId(as);
          const m = loadMastery(as);
          setMastery(m);
          const md = await loadMarkdown(course.path, as);
          const qsRaw = await loadQuestions(course.path, as);
          setMarkdown(md);
          setQuestions(
            qsRaw.map(q => ({
              stem: q.stem,
              choices: q.choices,
              correct: q.correct,
              explanation: q.solution || ''
            }))
          );
          setCurrentQ(m.next_q_index);
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

  function applyGrade(grade: number) {
    if (!mastery) return;
    const rating = grade === 5
      ? Rating.Easy
      : grade === 4
      ? Rating.Good
      : grade === 3
      ? Rating.Hard
      : Rating.Again;
    const { card } = scheduler.next(mastery.card, new Date(), rating);
    let last = [...mastery.lastGrades, grade];
    if (last.length > 3) last = last.slice(-3);
    const updated: Mastery = {
      ...mastery,
      card,
      n: mastery.n + 1,
      lastGrades: last,
      next_q_index: mastery.next_q_index + 1,
      status:
        mastery.n + 1 >= 3 && last.length >= 3 && last.every(g => g === 5)
          ? 'mastered'
          : 'in_progress'
    };
    setMastery(updated);
    saveMastery(asId, updated);
    nextQuestion();
  }

  function nextQuestion() {
    const idx = mastery ? mastery.next_q_index : currentQ + 1;
    if (idx < questions.length) {
      setCurrentQ(idx);
      setPhase('question');
      setSelected(null);
    } else {
      setAlertMsg('Skill complete!');
      exitLearning();
    }
  }

  function exitLearning() {
    if (mastery && asId) saveMastery(asId, mastery);
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
                  <>
                    <p style={{ color: 'green' }}>Correct!</p>
                    <p>{questions[currentQ].explanation}</p>
                    <div style={{ margin: '0.5rem 0' }}>
                      <button onClick={() => applyGrade(5)}>Easy</button>
                      <button onClick={() => applyGrade(4)}>Okay</button>
                      <button onClick={() => applyGrade(3)}>Hard</button>
                      <button onClick={() => applyGrade(2)}>Again</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ color: 'red' }}>Incorrect.</p>
                    <p>{questions[currentQ].explanation}</p>
                    <div style={{ margin: '0.5rem 0' }}>
                      <button onClick={() => applyGrade(1)}>Continue</button>
                    </div>
                  </>
                )}
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
