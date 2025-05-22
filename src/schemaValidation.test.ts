import { describe, it, expect } from 'vitest'
import { readFile } from 'fs/promises'
import path from 'path'
import Ajv from 'ajv'
import { load as loadYaml } from 'js-yaml'

const ajv = new Ajv()

async function loadJson(file: string) {
  const txt = await readFile(file, 'utf8')
  return JSON.parse(txt)
}

async function validate(schemaFile: string, dataFile: string, isYaml = false) {
  const schema = await loadJson(schemaFile)
  const validateFn = ajv.compile(schema)
  const dataTxt = await readFile(dataFile, 'utf8')
  const data = isYaml ? loadYaml(dataTxt) : JSON.parse(dataTxt)
  const valid = validateFn(data)
  if (!valid) console.error(validateFn.errors)
  expect(valid).toBe(true)
}

describe('sample data matches JSON schemas', () => {
  const root = process.cwd()
  it('validates courses.json', async () => {
    await validate(path.join(root, 'schema/courses-v1.json'), path.join(root, 'courses.json'))
  })
  it('validates catalog', async () => {
    await validate(path.join(root, 'schema/catalog-v1.json'), path.join(root, 'course/ea/catalog.json'))
  })
  it('validates topics', async () => {
    const schema = path.join(root, 'schema/topic-v1.json')
    for (const f of ['T001.json','T002.json']) {
      await validate(schema, path.join(root, 'course/ea/topics', f))
    }
  })
  it('validates skills', async () => {
    const schema = path.join(root, 'schema/skill-v1.json')
    for (const num of ['001','003','004','013']) {
      const f = `A${'S'}${num}.json`
      await validate(schema, path.join(root, 'course/ea/skills', f))
    }
  })
  it('validates question YAML', async () => {
    const schema = path.join(root, 'schema/asq-v1.json')
    for (const num of ['001','003','004','013']) {
      const f = `A${'S'}${num}.yaml`
      await validate(schema, path.join(root, 'course/ea/as_questions', f), true)
    }
  })
  it('validates save files', async () => {
    await validate(path.join(root, 'schema/mastery-v2.json'), path.join(root, 'save/mastery.json'))
    await validate(path.join(root, 'schema/attempts-v1.json'), path.join(root, 'save/attempt_window.json'))
    await validate(path.join(root, 'schema/xp-v1.json'), path.join(root, 'save/xp.json'))
    await validate(path.join(root, 'schema/prefs-v2.json'), path.join(root, 'save/prefs.json'))
  })
})
