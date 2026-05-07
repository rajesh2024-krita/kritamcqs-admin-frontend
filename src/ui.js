export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const ui = {
  buttonBase:
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition duration-200 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60",
  buttonPrimary:
    "bg-sky-600 text-white hover:-translate-y-0.5 hover:bg-sky-500 hover:shadow-lg hover:shadow-sky-200/70",
  buttonSecondary:
    "border border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700",
  buttonGhost:
    "border border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200",
  buttonDanger: "bg-rose-600 text-white hover:-translate-y-0.5 hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-200/70",
  panel:
    "admin-surface rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/70",
  compactPanel:
    "admin-surface rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/70",
  metricCard:
    "admin-surface rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/70",
  tile:
    "rounded-xl border border-slate-200/80 bg-slate-50 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-lg hover:shadow-slate-200/80",
  moduleCard:
    "rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-lg hover:shadow-slate-200/80",
  input:
    "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100",
  textarea:
    "min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100",
  checkbox:
    "h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500",
  field: "flex flex-col gap-2 text-sm font-medium text-slate-700",
  fieldFull: "md:col-span-2",
  muted: "text-slate-500",
  eyebrow: "mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700",
  badge:
    "inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-sky-700",
  pill:
    "inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700",
  metricTop: "mb-4 flex items-center justify-between gap-3",
  metricLabel: "text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500",
  metricDot: "h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]",
  metricValue: "text-3xl font-black tracking-tight text-slate-950",
  sectionHead: "flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center",
  activityList: "space-y-3",
  activityItem:
    "flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50 p-4 sm:flex-row sm:items-center",
  activityAvatar:
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-black text-white",
  activityBody: "min-w-0 flex-1",
  activityTime: "text-xs text-slate-500 sm:text-right",
  tableWrap:
    "admin-surface overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/70",
  tableScroll: "overflow-x-auto",
  table: "min-w-full border-separate border-spacing-0 text-left text-sm",
  tableHead:
    "border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500",
  tableCell: "border-b border-slate-100 px-4 py-3.5 align-top text-slate-700",
};
