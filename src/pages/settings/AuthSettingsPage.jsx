import { useEffect, useState } from "react";
import { subscriptionService } from "../../api/subscriptionService";
import { ToggleSwitch } from "../../components/forms/ToggleSwitch";
import { useToast } from "../../context/ToastContext";
import { EyeIcon } from "../../components/common/AdminIcons";
import { cn, ui } from "../../ui";
import {
  Shield,
  Key,
  Lock,
  Unlock,
  Mail,
  Phone,
  User,
  Users,
  Globe,
  Smartphone,
  Apple,
  Chrome,
  Settings,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Database,
  Server,
  Clock,
  Calendar,
  Zap,
  Award,
  Crown,
  Star,
  Sparkles,
  Fingerprint,
  FileText,
  Link,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Save,
  Send
} from "lucide-react";

export function AuthSettingsPage() {
  const toast = useToast();
  const [auth, setAuth] = useState({
    emailPasswordEnabled: true,
    googleEnabled: false,
    appleEnabled: true,
    googleClientId: "",
    googleAndroidClientId: "",
    googleIosClientId: "",
    googleAndroidPackageName: "app.kritamcqs.androidapp",
    googleAndroidSha1: "CE:34:23:0A:77:79:E5:01:09:10:2C:3C:A9:9C:B3:BF:7B:FD:AF:C4",
    googleClientSecret: "",
    googleRedirectUrls: [],
    googleCallbackUrl: "",
    appleBundleId: "app.kritamcqs.iosapp",
    profileMobileRequired: false,
    resetOtpExpiryMinutes: 10,
    resetOtpMaxAttempts: 5,
    resetOtpMaxResends: 3,
    sessionTimeoutMinutes: 43200,
    resetOtpEmailSubject: "Krita password reset OTP",
    resetOtpEmailTemplate: "",
    consentEnabled: true,
    consentRequiredForLogin: true,
    consentRequiredForSignup: true,
    consentText: "I agree to the Terms & Conditions and Privacy Policy.",
    consentButtonBehavior: "disable_until_checked",
    consentPolicySlugs: ["terms", "privacy"],
  });
  const [smtp, setSmtp] = useState({ host: "", port: 587, secure: false, user: "", pass: "", fromName: "Krita Admin", fromEmail: "" });
  const [invoiceSettings, setInvoiceSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);

  useEffect(() => {
    Promise.all([subscriptionService.getAuthSettings(), subscriptionService.getInvoiceSettings()])
      .then(([authResponse, invoiceResponse]) => {
        setAuth((current) => ({ ...current, ...(authResponse.data || {}) }));
        setInvoiceSettings(invoiceResponse.data || {});
        setSmtp((current) => ({ ...current, ...((invoiceResponse.data || {}).smtp || {}), pass: "" }));
      })
      .catch((error) => toast.error(error.message));
  }, []);

  async function saveSettings() {
    setSaving(true);
    try {
      const [authResponse] = await Promise.all([
        subscriptionService.saveAuthSettings(auth),
        subscriptionService.saveInvoiceSettings({
          ...(invoiceSettings || {}),
          smtp: {
            ...smtp,
            pass: smtp.pass || undefined,
          },
        }),
      ]);
      setAuth((current) => ({ ...current, ...(authResponse.data || {}), googleClientSecret: "" }));
      toast.success("Authentication settings saved");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function testSmtpConnection() {
    if (!smtp.fromEmail && !testEmail) {
      toast.error("Enter a recipient email or configure the sender email.");
      return;
    }
    setTesting(true);
    try {
      await subscriptionService.testInvoiceEmail({ to: testEmail || smtp.fromEmail });
      toast.success("SMTP test request sent. Check the recipient inbox.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setTesting(false);
    }
  }

  // Compact input classes
  const compactInput = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const compactSelect = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none";
  const compactTextarea = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y min-h-[50px]";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <Shield size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Authentication Settings</h1>
              <p className="text-xs text-slate-500">Control login methods, OAuth, and security rules</p>
            </div>
          </div>
          <button className={cn(
            "inline-flex items-center gap-0.5 px-2.5 py-0.5 text-[9px] font-medium rounded-lg transition-all",
            "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm shadow-indigo-500/25",
            saving && "opacity-50 cursor-not-allowed"
          )} disabled={saving} onClick={saveSettings}>
            <Save size={10} /> {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Login Methods */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Lock size={14} className="text-indigo-600" />
          <h2 className="text-xs font-semibold text-slate-900">Login Methods</h2>
          <span className="text-[8px] text-slate-400">Available authentication options</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5 mt-2 sm:grid-cols-2">
          <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200/50 px-2 py-1">
            <ToggleSwitch checked={auth.emailPasswordEnabled} onChange={(value) => setAuth((current) => ({ ...current, emailPasswordEnabled: value }))} label="" size="sm" />
            <span className="text-[8px] font-medium text-slate-700">Email / Password Login</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200/50 px-2 py-1">
            <ToggleSwitch checked={auth.googleEnabled} onChange={(value) => setAuth((current) => ({ ...current, googleEnabled: value }))} label="" size="sm" />
            <span className="text-[8px] font-medium text-slate-700">Google Login</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200/50 px-2 py-1">
            <ToggleSwitch checked={auth.appleEnabled} onChange={(value) => setAuth((current) => ({ ...current, appleEnabled: value }))} label="" size="sm" />
            <span className="text-[8px] font-medium text-slate-700">Sign in with Apple</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200/50 px-2 py-1">
            <ToggleSwitch checked={auth.profileMobileRequired} onChange={(value) => setAuth((current) => ({ ...current, profileMobileRequired: value }))} label="" size="sm" />
            <span className="text-[8px] font-medium text-slate-700">Require Mobile on Profile</span>
          </div>
        </div>
      </div>

      {/* Apple Sign In */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Apple size={14} className="text-indigo-600" />
          <h2 className="text-xs font-semibold text-slate-900">Apple Sign In</h2>
          <span className="text-[8px] text-slate-400">iOS native authentication</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5 mt-2 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">iOS Bundle ID</label>
            <input className={compactInput} value={auth.appleBundleId || ""} onChange={(event) => setAuth((current) => ({ ...current, appleBundleId: event.target.value }))} placeholder="app.kritamcqs.iosapp" />
          </div>
          <div className="bg-amber-50 rounded-lg border border-amber-200 px-2 py-1 flex items-center text-[7px] text-amber-700">
            <AlertCircle size={10} className="mr-1 flex-shrink-0" />
            Enable Sign in with Apple capability in Apple Developer
          </div>
        </div>
      </div>

      {/* Consent Settings */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <FileText size={14} className="text-indigo-600" />
          <h2 className="text-xs font-semibold text-slate-900">Login / Signup Consent</h2>
          <span className="text-[8px] text-slate-400">Agreement settings</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5 mt-2 sm:grid-cols-2">
          <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200/50 px-2 py-1">
            <ToggleSwitch checked={auth.consentEnabled} onChange={(value) => setAuth((current) => ({ ...current, consentEnabled: value }))} label="" size="sm" />
            <span className="text-[8px] font-medium text-slate-700">Show agreement checkbox</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200/50 px-2 py-1">
            <ToggleSwitch checked={auth.consentRequiredForLogin} onChange={(value) => setAuth((current) => ({ ...current, consentRequiredForLogin: value }))} label="" size="sm" />
            <span className="text-[8px] font-medium text-slate-700">Require on Login</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200/50 px-2 py-1">
            <ToggleSwitch checked={auth.consentRequiredForSignup} onChange={(value) => setAuth((current) => ({ ...current, consentRequiredForSignup: value }))} label="" size="sm" />
            <span className="text-[8px] font-medium text-slate-700">Require on Signup</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Button Behavior</label>
            <select className={compactSelect} value={auth.consentButtonBehavior || "disable_until_checked"} onChange={(event) => setAuth((current) => ({ ...current, consentButtonBehavior: event.target.value }))}>
              <option value="disable_until_checked">Disable until checked</option>
              <option value="show_error_on_submit">Show error on submit</option>
            </select>
          </div>
          <div className="flex flex-col gap-0.5 sm:col-span-2">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Agreement Text</label>
            <textarea className={compactTextarea} rows={2} value={auth.consentText || ""} onChange={(event) => setAuth((current) => ({ ...current, consentText: event.target.value }))} />
          </div>
          <div className="flex flex-col gap-0.5 sm:col-span-2">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Policy Page Slugs</label>
            <input className={compactInput} value={(auth.consentPolicySlugs || []).join(", ")} onChange={(event) => setAuth((current) => ({ ...current, consentPolicySlugs: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} placeholder="terms, privacy, refund" />
          </div>
        </div>
      </div>

      {/* Google OAuth */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Chrome size={14} className="text-indigo-600" />
          <h2 className="text-xs font-semibold text-slate-900">Google OAuth</h2>
          <span className="text-[8px] text-slate-400">Web, Android & iOS</span>
        </div>

        {/* Web Section */}
        <div className="mt-2 bg-blue-50 rounded-lg border border-blue-200 p-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Globe size={12} className="text-blue-600" />
            <span className="text-[8px] font-semibold text-blue-700">Web Application</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-500 uppercase tracking-wider">Web Client ID</label>
              <input className={compactInput} value={auth.googleClientId || ""} onChange={(event) => setAuth((current) => ({ ...current, googleClientId: event.target.value }))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-500 uppercase tracking-wider">Client Secret</label>
              <div className="flex gap-1">
                <input
                  className={cn(compactInput, "flex-1")}
                  type={showGoogleSecret ? "text" : "password"}
                  placeholder={auth.googleClientSecretConfigured ? "Configured - enter to replace" : ""}
                  value={auth.googleClientSecret || ""}
                  onChange={(event) => setAuth((current) => ({ ...current, googleClientSecret: event.target.value }))}
                />
                <button type="button" className="p-0.5 text-slate-400 hover:text-slate-600" onClick={() => setShowGoogleSecret((current) => !current)}>
                  {showGoogleSecret ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-500 uppercase tracking-wider">Redirect URL</label>
              <input className={compactInput} value={(auth.googleRedirectUrls || [])[0] || ""} onChange={(event) => setAuth((current) => ({ ...current, googleRedirectUrls: [event.target.value] }))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-500 uppercase tracking-wider">Callback URL</label>
              <input className={compactInput} value={auth.googleCallbackUrl || ""} onChange={(event) => setAuth((current) => ({ ...current, googleCallbackUrl: event.target.value }))} />
            </div>
          </div>
        </div>

        {/* Android Section */}
        <div className="mt-1.5 bg-emerald-50 rounded-lg border border-emerald-200 p-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Smartphone size={12} className="text-emerald-600" />
            <span className="text-[8px] font-semibold text-emerald-700">Android Application</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-500 uppercase tracking-wider">Android Client ID</label>
              <input className={compactInput} value={auth.googleAndroidClientId || ""} onChange={(event) => setAuth((current) => ({ ...current, googleAndroidClientId: event.target.value }))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-500 uppercase tracking-wider">Package Name</label>
              <input className={compactInput} value={auth.googleAndroidPackageName || ""} onChange={(event) => setAuth((current) => ({ ...current, googleAndroidPackageName: event.target.value }))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-500 uppercase tracking-wider">SHA-1 Fingerprint</label>
              <input className={compactInput} value={auth.googleAndroidSha1 || ""} onChange={(event) => setAuth((current) => ({ ...current, googleAndroidSha1: event.target.value.toUpperCase() }))} />
            </div>
          </div>
        </div>

        {/* iOS Section */}
        <div className="mt-1.5 bg-purple-50 rounded-lg border border-purple-200 p-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Apple size={12} className="text-purple-600" />
            <span className="text-[8px] font-semibold text-purple-700">iOS Application</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-500 uppercase tracking-wider">iOS Client ID</label>
              <input className={compactInput} value={auth.googleIosClientId || ""} onChange={(event) => setAuth((current) => ({ ...current, googleIosClientId: event.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      {/* SMTP Configuration */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-indigo-600" />
            <h2 className="text-xs font-semibold text-slate-900">SMTP Configuration</h2>
            <span className="text-[8px] text-slate-400">Email delivery</span>
          </div>
          <button type="button" className={cn(
            "inline-flex items-center gap-0.5 px-2 py-0.5 text-[7px] font-medium rounded transition-colors",
            testing ? "opacity-50 cursor-not-allowed" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          )} onClick={testSmtpConnection} disabled={testing}>
            <Send size={8} /> {testing ? "Testing..." : "Test SMTP"}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-1.5 mt-2 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">SMTP Host</label>
            <input className={compactInput} value={smtp.host || ""} onChange={(event) => setSmtp((current) => ({ ...current, host: event.target.value }))} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">SMTP Port</label>
            <input className={compactInput} type="number" value={smtp.port || 587} onChange={(event) => setSmtp((current) => ({ ...current, port: Number(event.target.value) }))} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">SMTP User</label>
            <input className={compactInput} value={smtp.user || ""} onChange={(event) => setSmtp((current) => ({ ...current, user: event.target.value }))} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">SMTP Password</label>
            <div className="flex gap-1">
              <input
                className={cn(compactInput, "flex-1")}
                type={showSmtpPassword ? "text" : "password"}
                placeholder={smtp.hasPassword ? "Configured - enter to replace" : ""}
                value={smtp.pass || ""}
                onChange={(event) => setSmtp((current) => ({ ...current, pass: event.target.value }))}
              />
              <button type="button" className="p-0.5 text-slate-400 hover:text-slate-600" onClick={() => setShowSmtpPassword((current) => !current)}>
                {showSmtpPassword ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">From Email</label>
            <input className={compactInput} type="email" value={smtp.fromEmail || ""} onChange={(event) => setSmtp((current) => ({ ...current, fromEmail: event.target.value }))} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Sender Name</label>
            <input className={compactInput} value={smtp.fromName || ""} onChange={(event) => setSmtp((current) => ({ ...current, fromName: event.target.value }))} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Encryption</label>
            <select className={compactSelect} value={smtp.secure ? "ssl" : "starttls"} onChange={(event) => setSmtp((current) => ({ ...current, secure: event.target.value === "ssl" }))}>
              <option value="starttls">TLS / STARTTLS</option>
              <option value="ssl">SSL (implicit TLS)</option>
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Test Recipient</label>
            <input className={compactInput} type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder={smtp.fromEmail || "recipient@example.com"} />
          </div>
        </div>
      </div>

      {/* Security Rules */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Shield size={14} className="text-indigo-600" />
          <h2 className="text-xs font-semibold text-slate-900">Security Rules</h2>
          <span className="text-[8px] text-slate-400">OTP & session policies</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5 mt-2 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">OTP Expiry (min)</label>
            <input className={compactInput} type="number" min="1" max="60" value={auth.resetOtpExpiryMinutes || 10} onChange={(event) => setAuth((current) => ({ ...current, resetOtpExpiryMinutes: Number(event.target.value) }))} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">OTP Attempts</label>
            <input className={compactInput} type="number" min="1" max="10" value={auth.resetOtpMaxAttempts || 5} onChange={(event) => setAuth((current) => ({ ...current, resetOtpMaxAttempts: Number(event.target.value) }))} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">OTP Resends</label>
            <input className={compactInput} type="number" min="1" max="10" value={auth.resetOtpMaxResends || 3} onChange={(event) => setAuth((current) => ({ ...current, resetOtpMaxResends: Number(event.target.value) }))} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Session Timeout (min)</label>
            <input className={compactInput} type="number" min="15" value={auth.sessionTimeoutMinutes || 43200} onChange={(event) => setAuth((current) => ({ ...current, sessionTimeoutMinutes: Number(event.target.value) }))} />
          </div>
          <div className="flex flex-col gap-0.5 sm:col-span-2">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Reset OTP Email Subject</label>
            <input className={compactInput} value={auth.resetOtpEmailSubject || ""} onChange={(event) => setAuth((current) => ({ ...current, resetOtpEmailSubject: event.target.value }))} />
          </div>
          <div className="flex flex-col gap-0.5 sm:col-span-2">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Reset OTP Email Template</label>
            <textarea className={compactTextarea} rows={3} value={auth.resetOtpEmailTemplate || ""} onChange={(event) => setAuth((current) => ({ ...current, resetOtpEmailTemplate: event.target.value }))} />
          </div>
        </div>
      </div>
    </div>
  );
}