import React, { createContext, useContext, useState } from 'react'

export interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastItem {
  id: number
  message: string
  actions?: ToastAction[]
}

const ToastContext = createContext<(msg: string, actions?: ToastAction[]) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = (msg: string, actions?: ToastAction[]) => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, message: msg, actions }])
    setTimeout(() => {
      setToasts(t => t.filter(toast => toast.id !== id))
    }, 4000)
  }

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-container" style={{ position: 'fixed', bottom: 20, right: 20 }}>
        {toasts.map(t => (
          <div key={t.id} className="toast bg-gray-800 text-white px-4 py-2 rounded mb-2 shadow-lg">
            <div>{t.message}</div>
            {t.actions && (
              <div className="flex space-x-2 mt-2">
                {t.actions.map((a, idx) => (
                  <button key={idx} className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded" onClick={a.onClick}>{a.label}</button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

