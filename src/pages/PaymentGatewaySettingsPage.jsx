import { useEffect, useState } from "react";
import { subscriptionService } from "../api/subscriptionService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ToggleSwitch } from "../components/forms/ToggleSwitch";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";
import { CreditCard, Shield, CheckCircle, XCircle, RefreshCw, Save, Key, Lock, Unlock, Zap, Building, Globe, DollarSign } from "lucide-react";

const defaultForm = {
  provider: "razorpay",
  razorpayKeyId: "",
  razorpayKeySecret: "",
  enabled: true,
};

function RazorpayLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0b72e7] text-base font-black italic text-white shadow-lg shadow-blue-200">
        R
      </div>
      <div>
        <div className="text-sm font-bold tracking-tight text-[#0b72e7]">Razorpay</div>
        <div className="text-[8px] font-medium uppercase tracking-wider text-slate-500">Payment Gateway</div>
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
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <CreditCard size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Payment Gateway</h1>
              <p className="text-xs text-slate-500">Razorpay Integration for subscription payments</p>
            </div>
          </div>
          <RazorpayLogo />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[
          { 
            label: "Provider", 
            value: "Razorpay", 
            icon: Building, 
            color: "blue" 
          },
          { 
            label: "Connection", 
            value: connected ? "Connected" : settings?.connectionStatus || "Not configured",
            icon: connected ? CheckCircle : XCircle,
            color: connected ? "emerald" : "amber"
          },
          { 
            label: "Secret Status", 
            value: settings?.hasRazorpayKeySecret ? settings.razorpayKeySecretMasked : "Missing",
            icon: settings?.hasRazorpayKeySecret ? Lock : Unlock,
            color: settings?.hasRazorpayKeySecret ? "emerald" : "rose"
          },
        ].map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: "bg-blue-50 text-blue-600",
            emerald: "bg-emerald-50 text-emerald-600",
            amber: "bg-amber-50 text-amber-600",
            rose: "bg-rose-50 text-rose-600",
          };
          return (
            <div key={stat.label} className="bg-white rounded-lg border border-slate-200/60 px-3 py-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <div className={`p-1 rounded ${colorClasses[stat.color]}`}>
                  <Icon size={12} className={colorClasses[stat.color]} />
                </div>
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Connection Message */}
      {settings?.connectionMessage && (
        <div className={cn(
          "rounded-lg border px-3 py-1.5 text-[10px] font-medium",
          connected ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
        )}>
          {settings.connectionMessage}
        </div>
      )}

      {/* Form */}
      <form className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm" onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Key size={14} className="text-indigo-600" />
            <h3 className="text-xs font-semibold text-slate-900">Razorpay Credentials</h3>
            <span className="text-[8px] text-slate-400">From Razorpay Dashboard</span>
          </div>
          <button className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-medium rounded-lg transition-all",
            "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm shadow-indigo-500/25",
            saving && "opacity-50 cursor-not-allowed"
          )} disabled={saving} type="submit">
            <Save size={10} /> {saving ? "Connecting..." : "Save & Test"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 mt-2 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Provider</label>
            <select className="w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none" value="razorpay" disabled>
              <option value="razorpay">Razorpay</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200/50 px-3 py-0.5">
              <ToggleSwitch checked={Boolean(formState.enabled)} onChange={(value) => setFormState((current) => ({ ...current, enabled: value }))} label="" size="sm" />
              <span className="text-[8px] font-medium text-slate-700">Enable Razorpay Payments</span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Key ID</label>
            <input
              className="w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={formState.razorpayKeyId}
              onChange={(event) => setFormState((current) => ({ ...current, razorpayKeyId: event.target.value }))}
              placeholder="rzp_live_xxxxx"
              required
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Key Secret</label>
            <input
              className="w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              type="password"
              value={formState.razorpayKeySecret}
              onChange={(event) => setFormState((current) => ({ ...current, razorpayKeySecret: event.target.value }))}
              placeholder={settings?.hasRazorpayKeySecret ? "Leave blank to keep existing" : "Enter Key Secret"}
              required={!settings?.hasRazorpayKeySecret}
            />
            {settings?.hasRazorpayKeySecret && (
              <p className="text-[7px] text-slate-400">Leave blank to keep current secret</p>
            )}
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[8px] text-slate-400">
          <Shield size={10} className="text-slate-400" />
          <span>Secret is encrypted and never shown after saving</span>
        </div>
      </form>
    </div>
  );
}