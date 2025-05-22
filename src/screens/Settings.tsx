import React from 'react'
import { useI18n } from '../i18n'
import { saveManager } from '../saveManagerSetup'

export default function Settings() {
  const strings = useI18n()

  const doExport = () => {
    void saveManager.exportProgress('export.zip')
  }

  const doImport = () => {
    void saveManager.importProgress('export.zip')
  }

  const doReset = () => {
    void saveManager.resetProfile()
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">{strings.settings}</h2>
      <button onClick={doExport}>{strings.export_progress}</button>
      <button onClick={doImport}>{strings.import_progress}</button>
      <button onClick={doReset}>{strings.reset_profile}</button>
    </div>
  )
}
