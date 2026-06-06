import { cn, ui } from "../../ui";

export function EntityFormWrapper({ title, subtitle, children, onCancel, onSubmit, submitLabel, submitDisabled = false, modalClassName = "", formClassName = "" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className={cn("admin-modal max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl shadow-slate-950/20", modalClassName)}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h3 className="text-xl font-black tracking-tight text-slate-950">{title}</h3>
              <p className="mt-2 text-slate-500">{subtitle}</p>
            </div>
          </div>
          <form className={cn("flex flex-col gap-6", formClassName)} onSubmit={onSubmit}>
            {children}
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className={cn(ui.buttonBase, ui.buttonGhost)} onClick={onCancel}>Cancel</button>
              <button type="submit" className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={submitDisabled}>{submitLabel}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
