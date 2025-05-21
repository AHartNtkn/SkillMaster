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
import ProgressChart, { logXp, logSkillEvent } from './ProgressChart';
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
import {
  ensureSaveDir,
  loadMasteryStore,
  saveMasteryStore,
  loadXpLog,
  loadSkillLog,
  saveXpLog,
  saveSkillLog,
} from './storage';

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
  ensureSaveDir();
  const store = loadMasteryStore();
  const data = store.ass[asId];
  if (!data) {
    return {
      status: 'unseen',
      card: createEmptyCard(new Date()),
      n: 0,
      lastGrades: [],
      next_q_index: 0,
    };
  }
  data.card.due = new Date(data.card.due);
  if (data.card.last_review) data.card.last_review = new Date(data.card.last_review);
  return data as Mastery;
}

function saveMastery(asId: string, m: Mastery) {
  ensureSaveDir();
  const store = loadMasteryStore();
  store.ass[asId] = m;
  saveMasteryStore(store);
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
  const [nextSkillInfo, setNextSkillInfo] = useState<
    | { id: string; name: string; action: 'Review' | 'New Skill'; coursePath: string }
    | null
  >(null);

  const dark = prefs.ui_theme === 'dark';

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  useEffect(() => {
    async function updateHome() {
      if (screen !== 'home') return;
      let currentDueSkillCount = 0;
      let currentNewSkillsCount = 0;
      const now = new Date();

      const store = loadMasteryStore();
      for (const m of Object.values(store.ass)) {
        const masteryItem: Mastery = {
          ...m,
          card: {
            ...m.card,
            due: new Date((m.card as any).due),
            last_review: m.card && (m.card as any).last_review ? new Date((m.card as any).last_review) : undefined,
          },
        };
        if (masteryItem.card && masteryItem.card.due <= now) {
          currentDueSkillCount++;
        }
        if (masteryItem.status === 'unseen') {
          currentNewSkillsCount++;
        }
      }
      setDueSkillCount(currentDueSkillCount);
      setNewSkillsCount(currentNewSkillsCount);

      if (prefs.xp_since_mixed_quiz >= MIXED_QUIZ_TRIGGER_XP) {
        setMixedQuizReady(true);
      } else {
        setMixedQuizReady(false);
      }

      const info = await getNextSkillInfo();
      setNextSkillInfo(info);
    }
    updateHome();
  }, [screen, prefs]);

  async function getNextSkillInfo() {
    const courses = await loadCourses();
    if (courses.length === 0) return null;
    const course = courses[0];
    const catalog = await loadCatalog(course.path);
    if (!catalog || catalog.entry_topics.length === 0) return null;

    const now = new Date();
    let newCandidate: string | null = null;
    let reviewCandidate: string | null = null;

    for (const topicId of catalog.entry_topics) {
      const topic = await loadTopic(course.path, topicId);
      if (!topic) continue;
      for (const as of topic.ass) {
        const m = loadMastery(as);
        if (m.status !== 'unseen' && m.card.due <= now) {
          reviewCandidate = as;
          break;
        }
        if (!newCandidate && m.status === 'unseen') {
          newCandidate = as;
        }
      }
      if (reviewCandidate) break;
    }

    const chosenId = reviewCandidate || newCandidate;
    if (!chosenId) return null;
    const skillData = await loadSkill(course.path, chosenId);
    const name = skillData?.name || '';
    return {
      id: chosenId,
      name,
      action: reviewCandidate ? ('Review' as const) : ('New Skill' as const),
      coursePath: course.path,
    };
  }

  async function startLearning() {
    setScreen('learning');
    setPhase('exposition');
    setCurrentQ(0);
    setSelected(null);
    setLoading(true);
    setConsecutiveEasyCount(0);
    setQuestionsPresentedInSession(1);

    const info = await getNextSkillInfo();
    if (!info) {
      setLoading(false);
      setAlertMsg('No skill available');
      return;
    }

    const { id, coursePath } = info;
    setCoursePath(coursePath);
    setAsId(id);

    const m = loadMastery(id);
    setMastery(m);
    setInitialSkillStatus(m.status);

    const skillData = await loadSkill(coursePath, id);
    setSkill(skillData);
    const md = await loadMarkdown(coursePath, id);
    const qsRaw = await loadQuestions(coursePath, id);
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

    logSkillEvent(asId, 'review');
    if (mastery.status !== 'mastered' && updatedMainSkillMastery.status === 'mastered') {
      logSkillEvent(asId, 'mastered');
    }

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
      logXp(XP_PER_AS_QUESTION, asId);
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
    ensureSaveDir();
    const out = {
      mastery: loadMasteryStore(),
      prefs: loadPrefs(),
      xp: { log: loadXpLog() },
      skill_log: { log: loadSkillLog() },
    };
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
        if (data.mastery) saveMasteryStore(data.mastery);
        if (data.prefs) savePrefs(data.prefs as Prefs);
        if (data.xp && Array.isArray(data.xp.log)) saveXpLog(data.xp.log);
        if (data.skill_log && Array.isArray(data.skill_log.log)) saveSkillLog(data.skill_log.log);
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
    ensureSaveDir();
    saveMasteryStore({ format: 'Mastery-v2', ass: {} });
    savePrefs({ xp_since_mixed_quiz: 0, last_as: '', ui_theme: 'default' });
    saveXpLog([]);
    saveSkillLog([]);
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
    <div className="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header>Skill Mastery</header>
      <div className="content" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
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
              <p>No skills due for review right now.</p>
            )}
            <button className="btn btn-primary" onClick={startLearning}>
              {nextSkillInfo
                ? `${nextSkillInfo.action}: ${nextSkillInfo.name} (${nextSkillInfo.id})`
                : 'Start Next Skill'}
            </button>
          </div>
        )}
        {screen === 'learning' && (
          <div>
            <div style={{ marginBottom: '0.5rem' }}>
              <button className="btn btn-inline" onClick={confirmExit}>Exit</button>
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
                    <button className="btn btn-primary" onClick={startQuestions}>
                      Start Questions
                    </button>
                  </>
                )}
              </div>
            )}
            {phase === 'question' && (
              <div>
                <p>{questions[currentQ].stem}</p>
                <ul className="choice-list">
                  {questions[currentQ].choices.map((c, i) => (
                    <li key={i} className="choice-item">
                      <button
                        className={`choice ${selected === i ? 'selected' : ''}`}
                        onClick={() => selectAnswer(i)}
                      >
                        {c}
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  className="btn btn-primary"
                  onClick={submitAnswer}
                  disabled={selected === null}
                >
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
                    <div className="btn-row">
                      <button className="btn" onClick={() => applyGrade(5)}>
                        Easy
                      </button>
                      <button className="btn" onClick={() => applyGrade(4)}>
                        Okay
                      </button>
                      <button className="btn" onClick={() => applyGrade(3)}>
                        Hard
                      </button>
                      <button className="btn" onClick={() => applyGrade(2)}>
                        Again
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ color: 'red' }}>Incorrect.</p>
                    <p>{questions[currentQ].explanation}</p>
                    <div className="btn-row">
                      <button className="btn" onClick={() => applyGrade(1)}>
                        Continue
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        {screen === 'progress' && <ProgressChart />}
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
              <button className="btn" onClick={() => fileInputRef.current?.click()}>Import Data</button>
              <input
                type="file"
                accept="application/json"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={importDataFile}
              />
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <button className="btn" onClick={exportData}>Export Data</button>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <button className="btn" onClick={confirmReset}>Reset Data</button>
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
        <div className="modal">
          <div className="modal-inner">
            <p>{alertMsg}</p>
            <button className="btn btn-primary" onClick={() => setAlertMsg(null)}>
              OK
            </button>
          </div>
        </div>
      )}
      {confirm && (
        <div className="modal">
          <div className="modal-inner">
            <p>{confirm.msg}</p>
            <button
              className="btn btn-primary btn-inline"
              onClick={confirm.onConfirm}
              style={{ marginRight: '0.5rem' }}
            >
              Yes
            </button>
            <button className="btn btn-inline" onClick={() => setConfirm(null)}>
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

