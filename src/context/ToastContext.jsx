import { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function pushToast(type, message) {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, type, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }

  const value = useMemo(
    () => ({
      toasts,
      success: (message) => pushToast("success", message),
      error: (message) => pushToast("error", message),
      info: (message) => pushToast("info", message),
    }),
    [toasts],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
