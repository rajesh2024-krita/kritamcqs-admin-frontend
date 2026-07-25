import { useEffect, useState } from "react";
import { Download, RefreshCw, Save, Trash2, X } from "lucide-react";
import { microsoftClarityService } from "../../api/microsoftClarityService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import { cn, ui } from "../../ui";

const logLevels = ["None", "Error", "Warning", "Info", "Verbose"];

const emptyForm = {
  enabled: false,
  projectId: "",
  logLevel: "None",
};

function normalizeSettings(value = {}) {
  return {
    enabled: Boolean(value.enabled),
    projectId: String(value.projectId || ""),
    logLevel: logLevels.includes(value.logLevel) ? value.logLevel : "None",
  };
}

export function MicrosoftClarityPage() {
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [saved, setSaved] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logMeta, setLogMeta] = useState(null);
  const [logFilter, setLogFilter] = useState({ level: "all", status: "all", search: "" });

  async function load() {
    setLoading(true);
    try {
      const [response, statusResponse, logsResponse] = await Promise.all([
        microsoftClarityService.get(),
        microsoftClarityService.status(),
        microsoftClarityService.logs(logFilter),
      ]);
      const next = normalizeSettings(response.data || response);
      setForm(next);
      setSaved(next);
      setStatus(statusResponse.data || null);
      setLogs(logsResponse.data || []);
      setLogMeta(logsResponse.meta || null);
    } catch (error) {
      toast.error(error.message || "Unable to load Microsoft Clarity settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      void microsoftClarityService.status().then((response) => setStatus(response.data || null)).catch(() => undefined);
      void microsoftClarityService.logs(logFilter).then((response) => {
        setLogs(response.data || []);
        setLogMeta(response.meta || null);
      }).catch(() => undefined);
    }, 30000);
    return () => window.clearInterval(id);
  }, [logFilter.level, logFilter.status, logFilter.search]);

  async function save(event) {
    event.preventDefault();
    const payload = normalizeSettings(form);
    if (payload.enabled && !payload.projectId.trim()) {
      toast.error("Clarity Project ID is required when Clarity is enabled");
      return;
    }

    setSaving(true);
    try {
      const response = await microsoftClarityService.save(payload);
      const next = normalizeSettings(response.data || response);
      setForm(next);
      setSaved(next);
      toast.success(response.message || "Microsoft Clarity settings saved");
    } catch (error) {
      toast.error(error.message || "Unable to save Microsoft Clarity settings");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setForm(saved);
  }

  async function refreshLogs() {
    try {
      const [statusResponse, logsResponse] = await Promise.all([
        microsoftClarityService.status(),
        microsoftClarityService.logs(logFilter),
      ]);
      setStatus(statusResponse.data || null);
      setLogs(logsResponse.data || []);
      setLogMeta(logsResponse.meta || null);
    } catch (error) {
      toast.error(error.message || "Unable to refresh Microsoft Clarity logs");
    }
  }

  async function clearLogs() {
    if (!window.confirm("Clear all Microsoft Clarity logs?")) return;
    try {
      const response = await microsoftClarityService.clearLogs();
      toast.success(response.message || "Microsoft Clarity logs cleared");
      await refreshLogs();
    } catch (error) {
      toast.error(error.message || "Unable to clear Microsoft Clarity logs");
    }
  }

  function indicatorClass(currentStatus = "") {
    if (["Connected", "Recording", "Uploading"].includes(currentStatus)) return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (currentStatus === "Waiting for Data") return "bg-yellow-50 text-yellow-700 border-yellow-100";
    if (currentStatus === "Initializing") return "bg-orange-50 text-orange-700 border-orange-100";
    if (["Initialization Failed", "Plugin Missing", "Project ID Invalid", "Internet Unavailable", "Native Error"].includes(currentStatus)) return "bg-rose-50 text-rose-700 border-rose-100";
    return "bg-slate-100 text-slate-600 border-slate-200";
  }

  const latest = status?.latest || {};

  return (
    <div className="flex flex-col gap-6">
      <div className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <div className={ui.eyebrow}>Settings</div>
            <h1 className="mb-1 text-3xl font-black tracking-tight text-slate-900">Microsoft Clarity</h1>
            <p className={ui.muted}>Control mobile analytics initialization from the admin panel.</p>
          </div>
          <span className={form.enabled ? "inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700" : "inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-600"}>
            {form.enabled ? "Enabled" : "Disabled"}
          </span>
        </div>
      </div>

      {loading ? <LoadingSpinner label="Loading Microsoft Clarity settings..." /> : null}

      {!loading ? (
        <>
        <section className={ui.panel}>
          <div className={ui.sectionHead}>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Current Status</h3>
              <p className={ui.muted}>Live SDK health from the latest mobile app heartbeat.</p>
            </div>
            <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] ${indicatorClass(status?.currentStatus)}`}>
              {status?.currentStatus || "Disabled"}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              ["Connected Devices", status?.connectedDevices || 0],
              ["Active Sessions", status?.activeSessions || 0],
              ["Failed Initializations", status?.failedInitializations || 0],
              ["Waiting Devices", status?.waitingDevices || 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <span className={ui.metricLabel}>{label}</span>
                <strong className="mt-2 block text-2xl font-black text-slate-950">{value}</strong>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              ["Platform", latest.platform || "-"],
              ["App Version", latest.appVersion || "-"],
              ["Plugin Version", latest.pluginVersion || "-"],
              ["Capacitor", latest.capacitorVersion || "-"],
              ["SDK Version", latest.sdkVersion || "-"],
              ["Project ID", latest.projectId || form.projectId || "-"],
              ["Last Connected", latest.timestamp ? new Date(latest.timestamp).toLocaleString() : "-"],
              ["Last Upload", latest.lastUploadAt ? new Date(latest.lastUploadAt).toLocaleString() : "-"],
              ["Last Session", latest.sessionId || "-"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
                <span className={ui.metricLabel}>{label}</span>
                <strong className="mt-2 block break-words text-sm font-bold text-slate-900">{value}</strong>
              </div>
            ))}
          </div>
        </section>

        <form className={ui.panel} onSubmit={save}>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <span>
                <span className="block text-sm font-bold text-slate-900">Enable Clarity</span>
                <span className="mt-1 block text-sm text-slate-500">Initialize Clarity on the next mobile app launch.</span>
              </span>
              <input
                className="h-5 w-5 accent-sky-600"
                type="checkbox"
                checked={form.enabled}
                onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
              />
            </label>

            <label className={ui.field}>
              <span>Log Level</span>
              <select
                className={ui.input}
                value={form.logLevel}
                required
                onChange={(event) => setForm((current) => ({ ...current, logLevel: event.target.value }))}
              >
                {logLevels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </label>

            <label className={cn(ui.field, "lg:col-span-2")}>
              <span>Clarity Project ID</span>
              <input
                className={ui.input}
                value={form.projectId}
                required={form.enabled}
                maxLength={80}
                placeholder="Enter Clarity Project ID"
                onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))}
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} type="button" disabled={saving} onClick={cancel}>
              <X size={16} /> Cancel
            </button>
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} type="submit" disabled={saving}>
              <Save size={16} /> {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
        </>
      ) : null}

      {!loading ? (
        <section className={ui.panel}>
          <div className={ui.sectionHead}>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Debug Logs</h3>
              <p className={ui.muted}>Newest first. Use these logs to identify plugin, network, project ID, or native failures.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className={cn(ui.buttonBase, ui.buttonSecondary)} type="button" onClick={refreshLogs}><RefreshCw size={16} /> Refresh</button>
              <button className={cn(ui.buttonBase, ui.buttonSecondary)} type="button" onClick={() => void microsoftClarityService.exportLogs("csv")}><Download size={16} /> Export CSV</button>
              <button className={cn(ui.buttonBase, ui.buttonDanger)} type="button" onClick={clearLogs}><Trash2 size={16} /> Clear Logs</button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <select className={ui.input} value={logFilter.level} onChange={(event) => setLogFilter((current) => ({ ...current, level: event.target.value }))}>
              <option value="all">All levels</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="info">Info</option>
            </select>
            <select className={ui.input} value={logFilter.status} onChange={(event) => setLogFilter((current) => ({ ...current, status: event.target.value }))}>
              {["all", "Initializing", "Connected", "Waiting for Data", "Uploading", "Recording", "Disabled", "Initialization Failed", "Plugin Missing", "Project ID Invalid", "Internet Unavailable", "Native Error"].map((item) => (
                <option key={item} value={item}>{item === "all" ? "All statuses" : item}</option>
              ))}
            </select>
            <input className={ui.input} placeholder="Search logs" value={logFilter.search} onChange={(event) => setLogFilter((current) => ({ ...current, search: event.target.value }))} onBlur={refreshLogs} />
          </div>
          <div className={cn(ui.tableWrap, "mt-4")}>
            <div className={ui.tableScroll}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th className={ui.tableHead}>Time</th>
                    <th className={ui.tableHead}>Level</th>
                    <th className={ui.tableHead}>Status</th>
                    <th className={ui.tableHead}>Message</th>
                    <th className={ui.tableHead}>Device</th>
                    <th className={ui.tableHead}>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className={ui.tableCell}>{log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"}</td>
                      <td className={ui.tableCell}>{log.level}</td>
                      <td className={ui.tableCell}><span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${indicatorClass(log.status)}`}>{log.status}</span></td>
                      <td className={ui.tableCell}>{log.message}</td>
                      <td className={ui.tableCell}>{log.platform || "-"}<br/><span className="text-xs text-slate-500">{log.appVersion || ""}</span></td>
                      <td className={ui.tableCell}><span className="text-rose-700">{log.errorMessage || "-"}</span></td>
                    </tr>
                  ))}
                  {!logs.length ? <tr><td className={ui.tableCell} colSpan={6}>No Microsoft Clarity logs found.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </div>
          {logMeta ? <p className="mt-3 text-sm text-slate-500">Showing {logs.length} of {logMeta.total || 0} logs.</p> : null}
        </section>
      ) : null}
    </div>
  );
}
