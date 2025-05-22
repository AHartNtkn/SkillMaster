import React, { createContext, useContext } from 'react'
import { SaveManager } from './saveManager'

const SaveManagerContext = createContext<SaveManager | null>(null)

export function useSaveManager(): SaveManager {
  const ctx = useContext(SaveManagerContext)
  if (!ctx) throw new Error('SaveManager not initialized')
  return ctx
}

export const SaveManagerProvider: React.FC<{
  manager: SaveManager
  children: React.ReactNode
}> = ({ manager, children }) => (
  <SaveManagerContext.Provider value={manager}>{children}</SaveManagerContext.Provider>
)
