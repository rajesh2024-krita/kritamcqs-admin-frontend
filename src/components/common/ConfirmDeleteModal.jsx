import { cn, ui } from "../../ui";

export function ConfirmDeleteModal({ open, title, description, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="admin-modal w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl shadow-slate-950/20">
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-950">{title}</h3>
            <p className="mt-2 text-slate-500">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={onCancel}>Cancel</button>
            <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={onConfirm}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}
