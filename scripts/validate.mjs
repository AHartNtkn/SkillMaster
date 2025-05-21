import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const schemaDir = path.join(root, 'schema');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function readYAML(p) {
  return yaml.load(fs.readFileSync(p, 'utf8'));
}

const ajv = new Ajv({ allErrors: true });

function compile(name) {
  return ajv.compile(readJSON(path.join(schemaDir, name)));
}

const schemas = {
  courses: compile('courses-v1.json'),
  catalog: compile('catalog-v1.json'),
  topic: compile('topic-v1.json'),
  skill: compile('skill-v1.json'),
  asq: compile('asq-v1.json'),
  mastery: compile('mastery-v2.json'),
  attempts: compile('attempts-v1.json'),
  xp: compile('xp-v1.json'),
  prefs: compile('prefs-v1.json')
};

function validate(file, schema) {
  const data = file.endsWith('.yaml') ? readYAML(file) : readJSON(file);
  if (!schema(data)) {
    console.error('Validation failed:', file);
    console.error(schema.errors);
    return false;
  }
  return true;
}

let ok = true;

ok &= validate(path.join(root, 'courses.json'), schemas.courses);

const courseDir = path.join(root, 'course', 'ea');
ok &= validate(path.join(courseDir, 'catalog.json'), schemas.catalog);
for (const f of fs.readdirSync(path.join(courseDir, 'topics'))) {
  ok &= validate(path.join(courseDir, 'topics', f), schemas.topic);
}
for (const f of fs.readdirSync(path.join(courseDir, 'skills'))) {
  ok &= validate(path.join(courseDir, 'skills', f), schemas.skill);
}
for (const f of fs.readdirSync(path.join(courseDir, 'as_questions'))) {
  ok &= validate(path.join(courseDir, 'as_questions', f), schemas.asq);
}
const saveMapping = {
  'mastery.json': schemas.mastery,
  'attempt_window.json': schemas.attempts,
  'xp.json': schemas.xp,
  'prefs.json': schemas.prefs
};
for (const [file, schema] of Object.entries(saveMapping)) {
  ok &= validate(path.join(root, 'save', file), schema);
}

if (!ok) {
  process.exit(1);
} else {
  console.log('All files valid');
}
