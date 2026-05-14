import { useEffect, useState } from "react";
import { subscriptionService } from "../api/subscriptionService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ToggleSwitch } from "../components/forms/ToggleSwitch";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

const defaultForm = {
  provider: "razorpay",
  razorpayKeyId: "",
  razorpayKeySecret: "",
  enabled: true,
};

function RazorpayLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#0b72e7] text-xl font-black italic text-white shadow-lg shadow-blue-200">
        R
      </div>
      <div>
        <div className="text-2xl font-black tracking-tight text-[#0b72e7]">Razorpay</div>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Payment Gateway</div>
      </div>
    </div>
  );
}

export function PaymentGatewaySettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [formState, setFormState] = useState(defaultForm);

  async function loadSettings() {
    setLoading(true);
    try {
      const response = await subscriptionService.getPaymentGatewaySettings();
      const data = response.data || {};
      setSettings(data);
      setFormState({
        provider: "razorpay",
        razorpayKeyId: data.razorpayKeyId || "",
        razorpayKeySecret: "",
        enabled: Boolean(data.enabled ?? true),
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        provider: "razorpay",
        razorpayKeyId: formState.razorpayKeyId.trim(),
        razorpayKeySecret: formState.razorpayKeySecret.trim(),
        enabled: Boolean(formState.enabled),
      };
      const response = await subscriptionService.savePaymentGatewaySettings(payload);
      setSettings(response.data || null);
      setFormState((current) => ({ ...current, razorpayKeySecret: "" }));
      toast.success(response.message || "Razorpay connection established");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading payment gateway settings..." />;

  const connected = settings?.connectionStatus === "connected" && settings?.enabled;

  return (
    <div className="flex flex-col gap-6">
      <section className={ui.panel}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className={ui.eyebrow}>Payment Gateway</div>
            <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-900">Razorpay Integration</h1>
            <p className={ui.muted}>Connect Razorpay so learner premium access is activated only after a verified successful payment.</p>
          </div>
          <RazorpayLogo />
        </div>
      </section>

      <section className={ui.compactPanel}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className={ui.tile}>
            <span className={ui.metricLabel}>Provider</span>
            <strong className="mt-3 block text-2xl font-black text-slate-900">Razorpay</strong>
          </div>
          <div className={ui.tile}>
            <span className={ui.metricLabel}>Connection</span>
            <strong className={`mt-3 block text-2xl font-black ${connected ? "text-emerald-700" : "text-amber-700"}`}>
              {connected ? "Connected" : settings?.connectionStatus || "Not configured"}
            </strong>
          </div>
          <div className={ui.tile}>
            <span className={ui.metricLabel}>Secret</span>
            <strong className="mt-3 block text-2xl font-black text-slate-900">
              {settings?.hasRazorpayKeySecret ? settings.razorpayKeySecretMasked : "Missing"}
            </strong>
          </div>
        </div>
        {settings?.connectionMessage ? (
          <div className="mt-4 rounded-sm border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
            {settings.connectionMessage}
          </div>
        ) : null}
      </section>

      <form className={ui.panel} onSubmit={handleSubmit}>
        <div className={ui.sectionHead}>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Razorpay Credentials</h3>
            <p className={ui.muted}>Save the Key ID and Key Secret from your Razorpay dashboard. The secret is never shown after saving.</p>
          </div>
          <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={saving} type="submit">
            {saving ? "Connecting..." : "Save & Test Connection"}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className={ui.field}>
            <span>Payment Provider</span>
            <select className={ui.input} value="razorpay" disabled>
              <option value="razorpay">Razorpay</option>
            </select>
          </label>
          <label className={ui.field}>
            <span>Enable Razorpay Payments</span>
            <div className="flex items-center gap-2 rounded-sm border border-slate-200 bg-white px-4 py-3">
              <ToggleSwitch checked={Boolean(formState.enabled)} onChange={(value) => setFormState((current) => ({ ...current, enabled: value }))} label="Use Razorpay for app subscription checkout" />
            </div>
          </label>
          <label className={ui.field}>
            <span>Razorpay Key ID</span>
            <input
              className={ui.input}
              value={formState.razorpayKeyId}
              onChange={(event) => setFormState((current) => ({ ...current, razorpayKeyId: event.target.value }))}
              placeholder="rzp_live_xxxxx"
              required
            />
          </label>
          <label className={ui.field}>
            <span>Razorpay Key Secret</span>
            <input
              className={ui.input}
              type="password"
              value={formState.razorpayKeySecret}
              onChange={(event) => setFormState((current) => ({ ...current, razorpayKeySecret: event.target.value }))}
              placeholder={settings?.hasRazorpayKeySecret ? "Leave blank to keep existing secret" : "Enter Key Secret"}
              required={!settings?.hasRazorpayKeySecret}
            />
          </label>
        </div>
      </form>
    </div>
  );
}
