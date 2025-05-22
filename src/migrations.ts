import { promises as fs } from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import { atomicWriteFile, readJsonWithRecovery } from './persistence'

/**
 * Load a JSON file and migrate it to the expected format if needed.
 * Migration scripts live in ../migrations/migrate_<from>_<to>.ts and
 * export a default function taking the old data and returning the new.
 * The original file is moved to backup_YYYYMMDD/ before writing the migrated data.
 */
export async function loadWithMigrations<T>(file: string, expectedFormat: string): Promise<T> {
  let data = await readJsonWithRecovery<any>(file)
  if (data.format === expectedFormat) {
    return data as T
  }
  const migrationName = `migrate_${data.format}_${expectedFormat}.ts`
  const migrationPath = path.resolve(__dirname, '..', 'migrations', migrationName)
  const { default: migrate } = await import(pathToFileURL(migrationPath).href)
  const migrated = await migrate(data)
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const backupDir = path.join(path.dirname(file), `backup_${date}`)
  await fs.mkdir(backupDir, { recursive: true })
  await fs.rename(file, path.join(backupDir, path.basename(file)))
  await atomicWriteFile(file, JSON.stringify(migrated, null, 2))
  return migrated as T
}
