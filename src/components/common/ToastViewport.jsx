import { useToast } from "../../context/ToastContext";
import { cn } from "../../ui";

export function ToastViewport() {
  const { toasts } = useToast();

  return (
    <div className="fixed right-4 top-4 z-[70] flex w-[calc(100vw-2rem)] max-w-md flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "admin-toast flex items-start gap-3 rounded-xl border bg-white px-4 py-4 text-sm font-semibold shadow-2xl shadow-slate-900/10 backdrop-blur",
            toast.type === "success" && "border-emerald-200 text-emerald-800",
            toast.type === "error" && "border-rose-200 text-rose-800",
            toast.type === "info" && "border-sky-200 text-sky-800",
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-white",
              toast.type === "success" && "bg-emerald-600",
              toast.type === "error" && "bg-rose-600",
              toast.type === "info" && "bg-sky-600",
            )}
          >
            {toast.type === "success" ? "S" : toast.type === "error" ? "!" : "i"}
          </span>
          <span className="min-w-0 flex-1 leading-5">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
