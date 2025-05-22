import { atomicWriteFile, readJsonWithRecovery } from './persistence'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { describe, it, expect } from 'vitest'

async function makeTempDir() {
  return await fs.mkdtemp(path.join(tmpdir(), 'persist-'))
}

describe('atomicWriteFile', () => {
  it('writes and renames without tmp residue', async () => {
    const dir = await makeTempDir()
    const file = path.join(dir, 'prefs.json')
    await atomicWriteFile(file, '{"a":1}')
    const data = await fs.readFile(file, 'utf8')
    expect(JSON.parse(data)).toEqual({ a: 1 })
    const files = await fs.readdir(dir)
    expect(files).toEqual(['prefs.json'])
  })
})

describe('readJsonWithRecovery', () => {
  it('recovers from leftover tmp file', async () => {
    const dir = await makeTempDir()
    const file = path.join(dir, 'prefs.json')
    const tmp = file + '.tmp'
    await fs.writeFile(tmp, '{"b":2}')
    const data = await readJsonWithRecovery<any>(file)
    expect(data).toEqual({ b: 2 })
    const files = await fs.readdir(dir)
    expect(files).toEqual(['prefs.json'])
  })
})
