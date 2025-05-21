import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';
import Ajv from 'ajv';
import { load as parseYaml } from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const ajv = new Ajv();
const topicSchema = JSON.parse(fs.readFileSync(path.join(root, 'schema/topic-v1.json'), 'utf8'));
const asqSchema = JSON.parse(fs.readFileSync(path.join(root, 'schema/asq-v1.json'), 'utf8'));
const validateTopic = ajv.compile(topicSchema);
const validateAsq = ajv.compile(asqSchema);

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function run() {
  const courses = readJson(path.join(root, 'courses.json'));
  assert.strictEqual(courses.format, 'Courses-v1');
  assert.ok(Array.isArray(courses.courses));
  for (const course of courses.courses) {
    const cPath = path.join(root, course.path);
    const catalog = readJson(path.join(cPath, 'catalog.json'));
    assert.strictEqual(catalog.format, 'Catalog-v1');
    const topicsDir = path.join(cPath, 'topics');
    const topicFiles = fs.readdirSync(topicsDir);
    assert.ok(topicFiles.length > 0);
    for (const f of topicFiles) {
      const data = readJson(path.join(topicsDir, f));
      assert.ok(validateTopic(data), `Topic invalid: ${f}`);
      for (const asId of data.ass) {
        const asFile = path.join(cPath, 'skills', `${asId.replace(':', '_')}.json`);
        assert.ok(fs.existsSync(asFile), `Missing skill file ${asFile}`);
      }
    }
    const asqDir = path.join(cPath, 'as_questions');
    const asqFiles = fs.readdirSync(asqDir);
    for (const f of asqFiles) {
      const content = fs.readFileSync(path.join(asqDir, f), 'utf8');
      const data = parseYaml(content);
      assert.ok(validateAsq(data), `ASQ invalid: ${f}`);
    }
  }
  console.log('All tests passed');
}

run();
