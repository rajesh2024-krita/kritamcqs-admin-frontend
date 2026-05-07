import { cn, ui } from "../../ui";

export function Pagination({ meta, onChange }) {
  if (!meta) return null;

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-500">
        Page {meta.page} of {meta.totalPages} | {meta.total} records
      </span>
      <div className="flex flex-wrap items-center gap-3">
        <button className={cn(ui.buttonBase, ui.buttonGhost)} disabled={meta.page <= 1} onClick={() => onChange(meta.page - 1)}>Previous</button>
        <button className={cn(ui.buttonBase, ui.buttonGhost)} disabled={meta.page >= meta.totalPages} onClick={() => onChange(meta.page + 1)}>Next</button>
      </div>
    </div>
  );
}
