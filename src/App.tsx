import React, { useEffect, useState, useRef } from 'react';
import { fsrs, Rating, createEmptyCard, Card } from 'ts-fsrs';
const scheduler = fsrs();
const ALPHA_IMPLICIT = 0.3;
import {
  applyGrade as engineApplyGrade,
  applyImplicitPrereqs,
  XP_PER_AS_QUESTION,
  MIXED_QUIZ_TRIGGER_XP,
} from './engine.js';
import CourseLibrary from './CourseLibrary';
import {
  loadCourses,
  loadCatalog,
  loadTopic,
  loadMarkdown,
  loadQuestions,
  loadSkill,
  Skill
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
  const [skill, setSkill] = useState<Skill | null>(null);
  const [coursePath, setCoursePath] = useState('');
  const [initialSkillStatus, setInitialSkillStatus] = useState<Mastery['status'] | null>(null);
  const [questionsPresentedInSession, setQuestionsPresentedInSession] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [consecutiveEasyCount, setConsecutiveEasyCount] = useState(0);

  const [dueSkillCount, setDueSkillCount] = useState(0);
  const [newSkillsCount, setNewSkillsCount] = useState(0);
  const [mixedQuizReady, setMixedQuizReady] = useState(false);

  const dark = prefs.ui_theme === 'dark';

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  useEffect(() => {
    if (screen === 'home') {
      let currentDueSkillCount = 0;
      let currentNewSkillsCount = 0;
      const now = new Date();

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('mastery_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const parsedData = JSON.parse(raw);
              // Reconstruct Mastery object with proper Date types for card
              const masteryItem: Mastery = {
                ...parsedData,
                card: {
                  ...parsedData.card,
                  due: parsedData.card && parsedData.card.due ? new Date(parsedData.card.due) : new Date(0), // Default to epoch if undefined after parse
                  last_review: parsedData.card && parsedData.card.last_review ? new Date(parsedData.card.last_review) : undefined,
                }
              };

              if (masteryItem.card && masteryItem.card.due <= now) {
                currentDueSkillCount++;
              }

              if (masteryItem.status === 'unseen') {
                currentNewSkillsCount++;
              }
            } catch (e) {
              console.error(`Failed to parse or process mastery data for key: ${key}`, e);
            }
          }
        }
      }
      setDueSkillCount(currentDueSkillCount);
      setNewSkillsCount(currentNewSkillsCount);

      if (prefs.xp_since_mixed_quiz >= MIXED_QUIZ_TRIGGER_XP) {
        setMixedQuizReady(true);
      } else {
        setMixedQuizReady(false);
      }
    }
  }, [screen, prefs]);

  async function startLearning() {
    setScreen('learning');
    setPhase('exposition');
    setCurrentQ(0);
    setSelected(null);
    setLoading(true);
    setConsecutiveEasyCount(0);
    setQuestionsPresentedInSession(1);
    const courses = await loadCourses();
    if (courses.length > 0) {
      const course = courses[0];
      setCoursePath(course.path);
      const catalog = await loadCatalog(course.path);
      if (catalog && catalog.entry_topics.length > 0) {
        const topic = await loadTopic(course.path, catalog.entry_topics[0]);
        if (topic && topic.ass.length > 0) {
          const as = topic.ass[0];
          setAsId(as);
          const m = loadMastery(as);
          setMastery(m);
          setInitialSkillStatus(m.status);
          const skillData = await loadSkill(course.path, as);
          setSkill(skillData);
          const md = await loadMarkdown(course.path, as);
          const qsRaw = await loadQuestions(course.path, as);
          setMarkdown(md || 'Content unavailable');
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
    if (!mastery || !skill || !asId) return;

    const store: Record<string, Mastery> = {};
    store[asId] = mastery;
    if (skill.prereqs) {
      for (const pid of skill.prereqs) {
        store[pid] = loadMastery(pid);
      }
    }

    const updatedMainSkillMastery = engineApplyGrade(store[asId], grade) as Mastery;
    store[asId] = updatedMainSkillMastery;

    applyImplicitPrereqs(skill, store, grade);

    setMastery(updatedMainSkillMastery);

    const newConsecutiveEasyCount = grade === 5 ? consecutiveEasyCount + 1 : 0;
    setConsecutiveEasyCount(newConsecutiveEasyCount);

    const lessonComplete = newConsecutiveEasyCount >= 2 || updatedMainSkillMastery.next_q_index >= questions.length;

    const skillWasUnseenAtStart = initialSkillStatus === 'unseen';

    if (!skillWasUnseenAtStart || lessonComplete) {
      for (const id of Object.keys(store)) {
        saveMastery(id, store[id]);
      }
      const newPrefs = {
        ...prefs,
        xp_since_mixed_quiz: prefs.xp_since_mixed_quiz + XP_PER_AS_QUESTION,
      };
      setPrefs(newPrefs);
    }

    if (lessonComplete) {
      setAlertMsg('Lesson complete!');
      exitLearning();
    } else {
      goToNextQuestion(updatedMainSkillMastery.next_q_index);
    }
  }

  function goToNextQuestion(nextQIndex: number) {
    setCurrentQ(nextQIndex);
    setPhase('question');
    setSelected(null);
    setQuestionsPresentedInSession(prev => prev + 1);
  }

  function exitLearning() {
    const lessonSuccessfullyCompleted = alertMsg === 'Lesson complete!';

    if (asId) {
      const skillWasUnseenAtStart = initialSkillStatus === 'unseen';

      if (!skillWasUnseenAtStart || lessonSuccessfullyCompleted) {
        setPrefs(p => ({ ...p, last_as: asId }));
      }
    }

    setScreen('home');
    setPhase('exposition');
    setCurrentQ(0);
    setSelected(null);
    setConsecutiveEasyCount(0);
    setInitialSkillStatus(null);
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

  function exportData() {
    const out: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith('mastery_') || k === 'prefs') {
        const val = localStorage.getItem(k);
        if (val) out[k] = JSON.parse(val);
      }
    }
    const blob = new Blob([JSON.stringify(out, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skillmaster_save.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importDataFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (typeof data !== 'object' || data === null) throw new Error();
        for (const [k, v] of Object.entries(data)) {
          if (k.startsWith('mastery_') || k === 'prefs') {
            localStorage.setItem(k, JSON.stringify(v));
          }
        }
        setPrefs(loadPrefs());
        setAlertMsg('Import complete');
      } catch {
        setAlertMsg('Failed to import data');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function resetData() {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith('mastery_') || k === 'prefs') {
        localStorage.removeItem(k);
      }
    }
    setPrefs(loadPrefs());
    setAlertMsg('All data reset');
  }

  function confirmReset() {
    setConfirm({
      msg: 'Delete all progress and preferences?',
      onConfirm: () => {
        resetData();
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
            {dueSkillCount > 0 && <p>{dueSkillCount} Skills Due for Review</p>}
            {newSkillsCount > 0 && (
              <p>
                {newSkillsCount} New Skills Available{' '}
                <small style={{ fontStyle: 'italic' }}>
                  (Note: Prerequisite check for availability not yet fully implemented for this count)
                </small>
              </p>
            )}
            {mixedQuizReady && <p>Mixed Quiz Ready!</p>}
            {dueSkillCount === 0 && newSkillsCount === 0 && !mixedQuizReady && (
              <p>All caught up! Nothing due right now.</p>
            )}
            <button onClick={startLearning}>Start Next Skill</button>
          </div>
        )}
        {screen === 'learning' && (
          <div>
            <div style={{ marginBottom: '0.5rem' }}>
              <button onClick={confirmExit}>Exit</button>
              <span style={{ marginLeft: '1rem' }}>
                {phase === 'exposition'
                  ? 'Skill Explanation'
                  : `Question ${questionsPresentedInSession}`}
              </span>
            </div>
            {phase === 'exposition' && (
              <div>
                {loading ? (
                  <p>Loading...</p>
                ) : markdown === 'Content unavailable' || questions.length === 0 ? (
                  <p>Content unavailable</p>
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
            <div style={{ marginTop: '1rem' }}>
              <button onClick={() => fileInputRef.current?.click()}>Import Data</button>
              <input
                type="file"
                accept="application/json"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={importDataFile}
              />
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <button onClick={exportData}>Export Data</button>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <button onClick={confirmReset}>Reset Data</button>
            </div>
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
