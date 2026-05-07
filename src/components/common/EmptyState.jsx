import { InboxIcon } from "./AdminIcons";

export function EmptyState({ title, description }) {
  return (
    <div className="admin-surface flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white p-8 text-center shadow-sm shadow-slate-200/70">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
        <InboxIcon size={24} />
      </div>
      <h3 className="text-xl font-black tracking-tight text-slate-950">{title}</h3>
      <p className="mt-2 text-slate-500">{description}</p>
    </div>
  );
}
