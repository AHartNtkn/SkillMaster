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
  prefs: compile('prefs-v2.json')
};

// simple sanity check for i18n file
function validateI18n() {
  const f = path.join(root, 'i18n', 'en.json');
  const data = readJSON(f);
  if (typeof data.toggle_dark_mode !== 'string') {
    console.error('Missing toggle_dark_mode in i18n/en.json');
    return false;
  }
  return true;
}

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
  const file = path.join(courseDir, 'as_questions', f);
  ok &= validate(file, schemas.asq);
  const data = readYAML(file);
  if (data.pool.length < 20) {
    console.error(`Question pool must have at least 20 items: ${f}`);
    ok = false;
  }
}

// ensure every skill has Markdown and question pool following conventions
for (const f of fs.readdirSync(path.join(courseDir, 'skills'))) {
  const skill = readJSON(path.join(courseDir, 'skills', f));
  const shortId = skill.id.split(':')[1];
  const mdPath = path.join(courseDir, 'as_md', `${shortId}.md`);
  if (!fs.existsSync(mdPath)) {
    console.error(`Missing Markdown for ${skill.id}`);
    ok = false;
  } else if (fs.readFileSync(mdPath, 'utf8').trim().length === 0) {
    console.error(`Empty Markdown for ${skill.id}`);
    ok = false;
  }
  const yamlPath = path.join(courseDir, 'as_questions', `${shortId}.yaml`);
  if (!fs.existsSync(yamlPath)) {
    console.error(`Missing questions for ${skill.id}`);
    ok = false;
  } else {
    const asq = readYAML(yamlPath);
    const expectedId = skill.id.replace(':', '_');
    if (asq.id !== expectedId) {
      console.error(`Question file id mismatch for ${skill.id}`);
      ok = false;
    }
  }
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

// ensure prefs theme is allowed
const prefs = readJSON(path.join(root, 'save', 'prefs.json'));
if (!['default', 'dark'].includes(prefs.ui_theme)) {
  console.error('prefs.ui_theme must be "default" or "dark"');
  ok = false;
}

ok &= validateI18n();

if (!ok) {
  process.exit(1);
} else {
  console.log('All files valid');
}
