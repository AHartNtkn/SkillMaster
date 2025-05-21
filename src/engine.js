import { fsrs, Rating, createEmptyCard } from 'ts-fsrs';

const scheduler = fsrs();

export const XP_PER_AS_QUESTION = 10;
export const XP_PER_MIXED_QUIZ_Q = 20;
export const MIXED_QUIZ_TRIGGER_XP = 150;
export const ALPHA_IMPLICIT = 0.3;

export function initMastery() {
  return {
    status: 'unseen',
    card: createEmptyCard(new Date()),
    n: 0,
    lastGrades: [],
    next_q_index: 0,
  };
}

function ratingFromGrade(g) {
  return g === 5
    ? Rating.Easy
    : g === 4
    ? Rating.Good
    : g === 3
    ? Rating.Hard
    : Rating.Again;
}

export function applyGrade(m, grade) {
  const now = new Date();
  const { card } = scheduler.next(m.card, now, ratingFromGrade(grade));
  let last = [...m.lastGrades, grade];
  if (last.length > 3) last = last.slice(-3);
  const n = m.n + 1;
  const status = n >= 3 && last.length >= 3 && last.every(g => g === 5)
    ? 'mastered'
    : 'in_progress';
  return {
    ...m,
    card,
    n,
    lastGrades: last,
    next_q_index: m.next_q_index + 1,
    status,
  };
}

export function applyImplicitPrereqs(skill, mastery, grade) {
  if (grade < 4 || !skill.prereqs) return;
  const now = new Date();
  for (const pid of skill.prereqs) {
    const weight = skill.weights?.[pid] ?? 1;
    const pm = mastery[pid] || initMastery();
    const { card } = scheduler.next(pm.card, now, Rating.Good);
    const damp = Math.max(1, Math.round(ALPHA_IMPLICIT * weight * card.scheduled_days));
    card.due = new Date(now.getTime() + damp * 86400000);
    card.scheduled_days = damp;
    mastery[pid] = { ...pm, card, status: 'in_progress' };
  }
}

export function runLesson(asId, grades, mastery, prefs, skill) {
  let m = mastery[asId] || initMastery();
  let consec = 0;
  for (const g of grades) {
    m = applyGrade(m, g);
    mastery[asId] = m;
    prefs.xp_since_mixed_quiz += XP_PER_AS_QUESTION;
    applyImplicitPrereqs(skill, mastery, g);
    consec = g === 5 ? consec + 1 : 0;
    if (consec >= 2) break;
  }
  prefs.last_as = asId;
}

export function runReview(asId, grade, mastery, prefs, skill) {
  let m = mastery[asId] || initMastery();
  m = applyGrade(m, grade);
  mastery[asId] = m;
  prefs.xp_since_mixed_quiz += XP_PER_AS_QUESTION;
  prefs.last_as = asId;
  applyImplicitPrereqs(skill, mastery, grade);
}

export function runMixedQuiz(asIds, grades, mastery, prefs, skills) {
  for (let i = 0; i < grades.length; i++) {
    const asId = asIds[i % asIds.length];
    const skill = skills[asId];
    let m = mastery[asId] || initMastery();
    m = applyGrade(m, grades[i]);
    mastery[asId] = m;
    prefs.xp_since_mixed_quiz += XP_PER_MIXED_QUIZ_Q;
    applyImplicitPrereqs(skill, mastery, grades[i]);
  }
  prefs.xp_since_mixed_quiz = 0;
  if (asIds.length > 0) prefs.last_as = asIds[asIds.length - 1];
}
