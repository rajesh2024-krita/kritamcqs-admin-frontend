export function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="admin-surface flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/70">
      <div className="flex items-center gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-sky-50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900">{label}</div>
          <div className="mt-1 text-xs text-slate-500">Preparing the latest admin data</div>
        </div>
      </div>
      <div className="admin-progress h-2 rounded-full bg-slate-100" />
    </div>
  );
}
