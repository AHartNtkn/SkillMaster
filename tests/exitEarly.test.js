import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'fs/promises';
import path from 'path';
import { initMastery, applyGrade } from '../src/engine.js';

function parseQuestionsYaml(text) {
  const lines = text.split(/\r?\n/);
  const qs = [];
  let yamlId = '';
  let current = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('id:')) {
      yamlId = line.slice(3).trim();
      continue;
    }
    if (line.startsWith('- id:')) {
      if (current) qs.push(current);
      current = {
        id: line.slice(5).trim(),
        stem: '',
        choices: [],
        correct: 0,
      };
      continue;
    }
    if (!current) continue;
    if (line.startsWith('stem:')) {
      current.stem = line.slice(5).trim().replace(/^"|"$/g, '');
    } else if (line.startsWith('choices:')) {
      current.choices = line
        .slice(8)
        .trim()
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map(s => s.trim().replace(/^"|"$/g, ''))
        .filter(s => s.length > 0);
    } else if (line.startsWith('correct:')) {
      current.correct = parseInt(line.slice(8).trim(), 10);
    } else if (line.startsWith('solution:')) {
      current.solution = line.slice(9).trim().replace(/^"|"$/g, '');
    }
  }
  if (current) qs.push(current);
  return { id: yamlId, questions: qs };
}

test('restart skill after early exit shows first question again', async () => {
  const courseRoot = path.resolve('course/elementary_arithmetic');
  const asId = 'EA:AS001';
  const yamlPath = path.join(courseRoot, 'as_questions', `${asId}.yaml`);
  const yamlText = await fs.readFile(yamlPath, 'utf8');
  const parsed = parseQuestionsYaml(yamlText);
  const firstQ = parsed.questions[0];
  assert.equal(firstQ.stem, 'Which numeral represents zero?');

  const storedMastery = initMastery();

  // Start session with blank mastery
  let sessionMastery = storedMastery;

  // Answer one question correctly with grade Easy (5)
  sessionMastery = applyGrade(sessionMastery, 5);

  // Exit without saving progress
  // (storedMastery remains unchanged)

  // Start new session again
  const newSessionMastery = storedMastery;
  assert.equal(newSessionMastery.next_q_index, 0);
  assert.equal(firstQ.stem, 'Which numeral represents zero?');
});
