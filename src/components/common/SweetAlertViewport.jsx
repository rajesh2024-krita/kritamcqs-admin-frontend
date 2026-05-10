import { useEffect, useState } from "react";

export const SWEET_ALERT_EVENT = "krita-admin:sweet-alert";

export function showSweetAlert(payload) {
  window.dispatchEvent(new CustomEvent(SWEET_ALERT_EVENT, { detail: payload }));
}

export function SweetAlertViewport() {
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const listener = (event) => setAlert(event.detail);
    window.addEventListener(SWEET_ALERT_EVENT, listener);
    return () => window.removeEventListener(SWEET_ALERT_EVENT, listener);
  }, []);

  if (!alert) return null;

  const type = alert.type || "info";
  const tone =
    type === "success"
      ? { border: "border-emerald-200", icon: "bg-emerald-600", mark: "✓", button: "bg-emerald-600 hover:bg-emerald-500" }
      : type === "error"
        ? { border: "border-rose-200", icon: "bg-rose-600", mark: "!", button: "bg-rose-600 hover:bg-rose-500" }
        : { border: "border-sky-200", icon: "bg-sky-600", mark: "i", button: "bg-sky-600 hover:bg-sky-500" };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-950/55 px-5 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-3xl border ${tone.border} bg-white p-6 text-center shadow-2xl`}>
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${tone.icon} text-3xl font-black text-white`}>
          {tone.mark}
        </div>
        <h2 className="text-2xl font-black text-slate-950">{alert.title || "Notice"}</h2>
        {alert.text ? <p className="mt-3 text-sm leading-6 text-slate-600">{alert.text}</p> : null}
        <button
          type="button"
          onClick={() => setAlert(null)}
          className={`mt-6 w-full rounded-2xl py-3 text-sm font-black text-white shadow-lg transition ${tone.button}`}
        >
          OK
        </button>
      </div>
    </div>
  );
}
