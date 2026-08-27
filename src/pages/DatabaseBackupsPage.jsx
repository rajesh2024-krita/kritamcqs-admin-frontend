import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, Database, Download, HardDrive, RefreshCw, RotateCcw } from "lucide-react";
import { databaseBackupService } from "../api/databaseBackupService";
import { useToast } from "../context/ToastContext";

const statusStyles = {
  completed: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-amber-100 text-amber-700",
  failed: "bg-rose-100 text-rose-700",
};

function formatBytes(value) {
  if (!Number.isFinite(Number(value))) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let size = Number(value); let index = 0;
  while (size >= 1024 && index < units.length - 1) { size /= 1024; index += 1; }
  return `${size.toFixed(index ? 1 : 0)} ${units[index]}`;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "—";
}

function PasswordDialog({ title, description, confirmLabel, danger = false, onClose, onConfirm }) {
  const [password, setPassword] = useState("");
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <form className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); if (password) onConfirm(password); }}>
        <div className="flex items-start gap-3">
          <span className={`rounded-xl p-2 ${danger ? "bg-rose-100 text-rose-600" : "bg-indigo-100 text-indigo-600"}`}><AlertTriangle size={22} /></span>
          <div><h2 className="text-lg font-bold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-600">{description}</p></div>
        </div>
        <label className="mt-5 block text-sm font-semibold text-slate-700">Admin password</label>
        <input autoFocus type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
          <button type="submit" disabled={!password} className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${danger ? "bg-rose-600" : "bg-indigo-600"}`}>{confirmLabel}</button>
        </div>
      </form>
    </div>
  );
}

export function DatabaseBackupsPage() {
  const toast = useToast();
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [toggleBusy, setToggleBusy] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await databaseBackupService.list();
      setOperations(response.data?.data || []);
      setSchedule(response.data?.schedule || null);
    }
    catch (error) { if (!quiet) toast.error(error.message); }
    finally { if (!quiet) setLoading(false); }
  }, [toast]);

  useEffect(() => { void load(); const id = window.setInterval(() => void load(true), 5000); return () => window.clearInterval(id); }, [load]);
  const backups = useMemo(() => operations.filter((item) => item.kind === "backup"), [operations]);
  const lastBackup = useMemo(() => backups.find((item) => item.status === "completed"), [backups]);
  const hasActive = operations.some((item) => item.status === "in_progress");

  async function createBackup(password) {
    setBusy(true);
    try { await databaseBackupService.create(password); setDialog(null); toast.success("Manual backup queued"); window.setTimeout(() => void load(true), 500); }
    catch (error) { toast.error(error.message); } finally { setBusy(false); }
  }

  async function toggleAutomaticBackups() {
    const nextEnabled = !schedule?.settings?.automaticEnabled;
    setToggleBusy(true);
    try {
      const response = await databaseBackupService.updateSettings(nextEnabled);
      setSchedule(response.data?.schedule || schedule);
      toast.success(`Automatic backups ${nextEnabled ? "enabled" : "disabled"}`);
      void load(true);
    } catch (error) { toast.error(error.message); } finally { setToggleBusy(false); }
  }

  async function downloadBackup(backup, password) {
    setBusy(true);
    try {
      const response = await databaseBackupService.download(backup.id, password);
      const url = URL.createObjectURL(response.data); const anchor = document.createElement("a");
      anchor.href = url; anchor.download = backup.fileName || "database-backup.archive.gz"; anchor.click(); URL.revokeObjectURL(url);
      setDialog(null); toast.success("Backup download started");
    } catch (error) { toast.error(error.message); } finally { setBusy(false); }
  }

  async function authorizeRestore(backup, password) {
    setBusy(true);
    try {
      const response = await databaseBackupService.authorizeRestore(backup.id, password);
      setDialog(null);
      const finalYes = window.confirm(`FINAL WARNING\n\nRestore ${backup.fileName}?\n\nThis will replace matching collections in the live database. A safety backup will be created first. This action cannot be cancelled after it starts.`);
      if (!finalYes) return;
      await databaseBackupService.restore(backup.id, response.data?.data?.token);
      toast.success("Restore queued; status will update automatically"); window.setTimeout(() => void load(true), 500);
    } catch (error) { toast.error(error.message); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-black text-slate-900">Database Backup</h1><p className="mt-1 text-sm text-slate-500">Daily rolling backups, secure downloads, and audited restore operations.</p></div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(schedule?.settings?.automaticEnabled)}
            disabled={!schedule || toggleBusy}
            onClick={toggleAutomaticBackups}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold disabled:opacity-50 ${schedule?.settings?.automaticEnabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-white text-slate-600"}`}
          >
            <span className={`relative h-5 w-9 rounded-full transition ${schedule?.settings?.automaticEnabled ? "bg-emerald-500" : "bg-slate-300"}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${schedule?.settings?.automaticEnabled ? "left-[18px]" : "left-0.5"}`} /></span>
            Auto backup {schedule?.settings?.automaticEnabled ? "On" : "Off"}
          </button>
          <button onClick={() => void load()} className="rounded-xl border border-slate-300 p-2.5 text-slate-600" aria-label="Refresh"><RefreshCw size={18} /></button>
          <button disabled={hasActive || busy} onClick={() => setDialog({ type: "create" })} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Database size={17} /> Create Backup</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><HardDrive className="text-indigo-600" /><p className="mt-3 text-lg font-black text-slate-900">{formatDate(lastBackup?.completedAt)}</p><p className="text-sm text-slate-500">Last backup date</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><CalendarClock className={schedule?.settings?.automaticEnabled ? "text-emerald-600" : "text-slate-400"} /><p className="mt-3 text-lg font-black text-slate-900">{schedule?.settings?.automaticEnabled ? formatDate(schedule?.nextAutomaticBackupAt) : "Disabled"}</p><p className="text-sm text-slate-500">Next automatic backup</p><p className="mt-1 text-xs text-slate-400">Daily at {String(schedule?.settings?.backupHourUtc ?? 0).padStart(2, "0")}:00 UTC</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><RefreshCw className="text-amber-600" /><p className="mt-3 text-2xl font-black">{operations.filter((x) => x.status === "in_progress").length}</p><p className="text-sm text-slate-500">In progress</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><AlertTriangle className="text-rose-600" /><p className="mt-3 text-2xl font-black">{operations.filter((x) => x.status === "failed").length}</p><p className="text-sm text-slate-500">Failed operations</p></div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto"><table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Operation / date", "Start", "Completion", "Status", "Type", "Size / duration", "Created by", "Actions"].map((x) => <th key={x} className="px-4 py-3 font-bold">{x}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {operations.map((item) => <tr key={item.id} className={item.status === "failed" ? "bg-rose-50/60" : ""}>
              <td className="px-4 py-4"><p className="font-semibold text-slate-800 capitalize">{item.kind}</p><p className="max-w-52 truncate text-xs text-slate-500" title={item.fileName}>{item.fileName || formatDate(item.startedAt)}</p>{item.errorDetails && <p className="mt-1 max-w-xs text-xs text-rose-700" title={item.errorDetails}>{item.errorDetails}</p>}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatDate(item.startedAt)}</td><td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatDate(item.completedAt)}</td>
              <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[item.status]}`}>{item.status?.replace("_", " ")}</span></td>
              <td className="px-4 py-4 capitalize text-slate-600">{item.kind === "restore" ? "Restore" : item.backupType}</td>
              <td className="px-4 py-4 text-slate-600">{formatBytes(item.sizeBytes)}<br/><span className="text-xs">{item.durationMs == null ? "—" : `${(item.durationMs / 1000).toFixed(1)}s`}</span></td>
              <td className="px-4 py-4 text-slate-600">{item.createdByName || "System"}</td>
              <td className="px-4 py-4">{item.kind === "backup" && item.status === "completed" && item.backupType !== "safety" && <div className="flex gap-2"><button onClick={() => setDialog({ type: "download", backup: item })} className="rounded-lg border border-slate-300 p-2 text-slate-600" title="Download"><Download size={16}/></button><button disabled={hasActive} onClick={() => setDialog({ type: "restore", backup: item })} className="rounded-lg border border-rose-200 p-2 text-rose-600 disabled:opacity-40" title="Restore"><RotateCcw size={16}/></button></div>}</td>
            </tr>)}
            {!loading && !operations.length && <tr><td colSpan="8" className="px-4 py-12 text-center text-slate-500">No backup history yet.</td></tr>}
          </tbody>
        </table></div>
        {loading && <div className="p-10 text-center text-slate-500">Loading backup history…</div>}
      </div>

      {dialog?.type === "create" && <PasswordDialog title="Create manual backup?" description="Confirm the request with your admin password. The backup runs safely in the background." confirmLabel={busy ? "Starting…" : "Create Backup"} onClose={() => setDialog(null)} onConfirm={createBackup} />}
      {dialog?.type === "download" && <PasswordDialog title="Download protected backup" description={`${dialog.backup.fileName} (${formatBytes(dialog.backup.sizeBytes)}). Enter your password to continue.`} confirmLabel={busy ? "Preparing…" : "Download"} onClose={() => setDialog(null)} onConfirm={(password) => downloadBackup(dialog.backup, password)} />}
      {dialog?.type === "restore" && <PasswordDialog danger title="Restore the live database?" description={`Selected: ${dialog.backup.fileName}, ${formatBytes(dialog.backup.sizeBytes)}, created ${formatDate(dialog.backup.startedAt)}. Restoring replaces current live data. Enter your password; a separate final Yes/No confirmation follows.`} confirmLabel={busy ? "Verifying…" : "Verify Password"} onClose={() => setDialog(null)} onConfirm={(password) => authorizeRestore(dialog.backup, password)} />}
    </div>
  );
}
