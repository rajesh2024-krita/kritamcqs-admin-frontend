import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
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

  async function load() {
    setLoading(true);
    try {
      const [response, statusResponse] = await Promise.all([
        microsoftClarityService.get(),
        microsoftClarityService.status(),
      ]);
      const next = normalizeSettings(response.data || response);
      setForm(next);
      setSaved(next);
      setStatus(statusResponse.data || null);
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
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

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

  function indicatorClass(currentStatus = "") {
    if (["Connected", "Recording", "Uploading"].includes(currentStatus)) return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (currentStatus === "Waiting for Data") return "bg-yellow-50 text-yellow-700 border-yellow-100";
    if (currentStatus === "Initializing") return "bg-orange-50 text-orange-700 border-orange-100";
    if (["Configuration API Failed", "Cordova Not Ready", "Device Not Ready", "Initialization Failed", "Plugin Not Loaded", "Plugin Missing", "Project ID Invalid", "Internet Unavailable", "Native Error", "SDK Initialization Failed", "Session Not Created", "Upload Blocked", "Upload Failed"].includes(currentStatus)) return "bg-rose-50 text-rose-700 border-rose-100";
    return "bg-slate-100 text-slate-600 border-slate-200";
  }

  const latest = status?.latest || {};
  const liveDebug = status?.liveDebug || {};

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
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Live Debug Console</h4>
                <p className="mt-1 text-sm text-slate-500">Auto-refreshes from the latest mobile SDK event.</p>
              </div>
              <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] ${indicatorClass(liveDebug.uploadStatus)}`}>
                {liveDebug.uploadStatus || "Unknown"}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                ["Plugin Loaded", liveDebug.pluginLoaded ? "Yes" : "No"],
                ["Plugin Source", liveDebug.pluginSource || "-"],
                ["Device Ready", liveDebug.deviceReady ? "Yes" : "No"],
                ["Cordova Loaded", liveDebug.cordovaLoaded ? "Yes" : "No"],
                ["SDK Initialized", liveDebug.sdkInitialized ? "Yes" : "No"],
                ["Current Session", liveDebug.currentSession || "-"],
                ["Session URL", liveDebug.sessionUrl || "-"],
                ["Last API Call", liveDebug.lastApiCall || "-"],
                ["Last Native Event", liveDebug.lastNativeEvent ? JSON.stringify(liveDebug.lastNativeEvent) : "-"],
                ["Last Error", liveDebug.lastError || "-"],
                ["Retry Count", liveDebug.retryCount ?? 0],
                ["Connection", `${liveDebug.online === false ? "Offline" : "Online"} / ${liveDebug.connectionType || "unknown"}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white p-3">
                  <span className={ui.metricLabel}>{label}</span>
                  <strong className="mt-2 block break-words text-sm font-bold text-slate-900">{value}</strong>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
              <span className={ui.metricLabel}>Available Methods</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(liveDebug.availableMethods || {}).map(([method, exists]) => (
                  <span key={method} className={exists ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700" : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500"}>
                    {method}: {exists ? "yes" : "no"}
                  </span>
                ))}
                {!Object.keys(liveDebug.availableMethods || {}).length ? <span className="text-sm text-slate-500">No method snapshot yet.</span> : null}
              </div>
            </div>
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
    </div>
  );
}
