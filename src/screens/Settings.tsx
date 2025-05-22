import React from 'react'
import { useSaveManager } from '../saveContext'

export default function Settings() {
  const manager = useSaveManager()

  const doExport = () => {
    const path = window.prompt('Export file', 'progress.zip')
    if (path) manager.exportProgress(path)
  }

  const doImport = () => {
    const path = window.prompt('Import file', 'progress.zip')
    if (path) manager.importProgress(path)
  }

  const doReset = () => {
    if (window.confirm('Reset profile?')) manager.resetProfile()
  }

  return (
    <div className="p-4 space-y-2">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <button onClick={doImport} className="bg-blue-500 text-white px-4 py-2 rounded w-full">Import Progress</button>
      <button onClick={doExport} className="bg-green-500 text-white px-4 py-2 rounded w-full">Export Progress</button>
      <button onClick={doReset} className="bg-red-500 text-white px-4 py-2 rounded w-full">Reset Profile</button>
    </div>
  )
}
