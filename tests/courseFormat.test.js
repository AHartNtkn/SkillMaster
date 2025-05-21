import fs from 'fs/promises';
import path from 'path';
import assert from 'node:assert/strict';
import { test } from 'node:test';

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function countQuestionItems(yamlText) {
  const lines = yamlText.split(/\r?\n/);
  let count = 0;
  for (const line of lines) {
    if (line.trim().startsWith('- id:')) count++;
  }
  return count;
}

test('courses.json format', async () => {
  const root = path.resolve('.');
  const data = JSON.parse(await fs.readFile(path.join(root, 'courses.json'), 'utf8'));
  assert.equal(data.format, 'Courses-v1');
  assert.ok(Array.isArray(data.courses));
  for (const course of data.courses) {
    assert.ok(course.id && course.name && course.path);
    await checkCourse(path.join(root, course.path), course.id);
  }
});

async function checkCourse(coursePath, courseId) {
  const catalogPath = path.join(coursePath, 'catalog.json');
  const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
  assert.equal(catalog.format, 'Catalog-v1');
  assert.equal(catalog.course_id, courseId);
  assert.ok(Array.isArray(catalog.entry_topics));
  assert.ok(typeof catalog.description === 'string');

  for (const dir of ['topics', 'skills', 'as_md', 'as_questions']) {
    assert.ok(await fileExists(path.join(coursePath, dir)), `missing ${dir}`);
  }

  const topicsDir = path.join(coursePath, 'topics');
  for (const file of await fs.readdir(topicsDir)) {
    if (!file.endsWith('.json')) continue;
    const t = JSON.parse(await fs.readFile(path.join(topicsDir, file), 'utf8'));
    assert.equal(t.id + '.json', file);
    assert.ok(typeof t.name === 'string');
    assert.ok(Array.isArray(t.ass));
  }

  const skillsDir = path.join(coursePath, 'skills');
  for (const file of await fs.readdir(skillsDir)) {
    if (!file.endsWith('.json')) continue;
    const s = JSON.parse(await fs.readFile(path.join(skillsDir, file), 'utf8'));
    assert.equal(s.id + '.json', file);
    assert.ok(typeof s.name === 'string');
    if (s.prereqs) assert.ok(Array.isArray(s.prereqs));
    if (s.weights) assert.ok(typeof s.weights === 'object');

    // confirm markdown and questions exist
    const mdPath = path.join(coursePath, 'as_md', s.id + '.md');
    const qPath = path.join(coursePath, 'as_questions', s.id + '.yaml');
    assert.ok(await fileExists(mdPath), `missing ${mdPath}`);
    assert.ok(await fileExists(qPath), `missing ${qPath}`);

    const qText = await fs.readFile(qPath, 'utf8');
    assert.ok(qText.startsWith('format:'), 'questions missing format');
    const idLine = qText
      .split(/\r?\n/)
      .find(l => l.startsWith('id:'));
    assert.ok(idLine, 'questions missing id');
    const yamlId = idLine.split(':')[1].trim();
    const expectedId = s.id.replace(':', '_');
    assert.equal(yamlId, expectedId, 'yaml id mismatch');
    const count = countQuestionItems(qText);
    assert.ok(count >= 20, `less than 20 questions in ${qPath}`);
  }
}
