import { useCallback, useState } from 'react'
import { ToastContext } from './toastContext'

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random()
    const item = { id, type: toast.type || 'info', message: toast.message }
    setToasts((prev) => [...prev, item])
    setTimeout(() => remove(id), toast.duration || 4000)
    return id
  }, [remove])

  return (
    <ToastContext.Provider value={{ addToast, remove }}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-xl border px-4 py-2.5 text-sm shadow-lg ${
              toast.type === 'error'
                ? 'border-red-400/40 bg-red-500/10 text-red-200'
                : toast.type === 'success'
                  ? 'border-green-400/30 bg-green-500/10 text-green-200'
                  : 'border-line bg-card text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
