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

  async function load() {
    setLoading(true);
    try {
      const response = await microsoftClarityService.get();
      const next = normalizeSettings(response.data || response);
      setForm(next);
      setSaved(next);
    } catch (error) {
      toast.error(error.message || "Unable to load Microsoft Clarity settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
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
      ) : null}
    </div>
  );
}
