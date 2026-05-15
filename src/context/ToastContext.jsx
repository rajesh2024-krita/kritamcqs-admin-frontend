import { createContext, useContext, useMemo, useState } from "react";
import { showSweetAlert } from "../components/common/SweetAlertViewport";

const ToastContext = createContext(null);

function generateToastId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function pushToast(type, message) {
    const id = generateToastId();
    setToasts((current) => [...current, { id, type, message }]);
    showSweetAlert({
      type,
      title: type === "success" ? "Success" : type === "error" ? "Error" : "Notice",
      text: message,
    });
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
