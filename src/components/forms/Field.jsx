import { cn, ui } from "../../ui";

export function Field({ label, error, children, className = "" }) {
  return (
    <label className={cn(ui.field, className)}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {error ? <span className="text-sm text-rose-600">{error}</span> : null}
    </label>
  );
}
