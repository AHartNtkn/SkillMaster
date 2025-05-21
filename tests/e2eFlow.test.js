import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'fs/promises';
import path from 'path';
import {
  initMastery,
  runLesson,
  runReview,
  runMixedQuiz,
  XP_PER_AS_QUESTION,
  XP_PER_MIXED_QUIZ_Q,
} from '../src/engine.js';

async function loadSkill(asId) {
  const root = path.resolve('course/elementary_arithmetic');
  const txt = await fs.readFile(path.join(root, 'skills', `${asId}.json`), 'utf8');
  return JSON.parse(txt);
}

test('lesson → review → mixed quiz flow', async () => {
  const mastery = {};
  const prefs = { xp_since_mixed_quiz: 0, last_as: '', ui_theme: 'default' };
  const skill = await loadSkill('EA:AS001');

  // Lesson mini-quiz until two Easy grades
  runLesson('EA:AS001', [5, 5], mastery, prefs, skill);
  assert.equal(mastery['EA:AS001'].n, 2);
  assert.equal(prefs.xp_since_mixed_quiz, 2 * XP_PER_AS_QUESTION);
  assert.equal(prefs.last_as, 'EA:AS001');

  // Due review
  runReview('EA:AS001', 4, mastery, prefs, skill);
  assert.equal(mastery['EA:AS001'].n, 3);
  assert.equal(prefs.xp_since_mixed_quiz, 3 * XP_PER_AS_QUESTION);

  // Prepare for mixed quiz with mastered skill
  mastery['EA:AS001'].status = 'mastered';
  const skills = { 'EA:AS001': skill };
  prefs.xp_since_mixed_quiz = 150;
  const grades = new Array(15).fill(4);
  runMixedQuiz(['EA:AS001'], grades, mastery, prefs, skills);
  assert.equal(prefs.xp_since_mixed_quiz, 0);
  assert.equal(mastery['EA:AS001'].n, 18);
});
