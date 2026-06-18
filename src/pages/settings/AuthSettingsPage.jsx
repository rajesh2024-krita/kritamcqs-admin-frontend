import { useEffect, useState } from "react";
import { subscriptionService } from "../../api/subscriptionService";
import { ToggleSwitch } from "../../components/forms/ToggleSwitch";
import { useToast } from "../../context/ToastContext";
import { EyeIcon } from "../../components/common/AdminIcons";
import { cn, ui } from "../../ui";

export function AuthSettingsPage() {
  const toast = useToast();
  const [auth, setAuth] = useState({
    emailPasswordEnabled: true,
    googleEnabled: false,
    googleClientId: "",
    googleAndroidClientId: "",
    googleIosClientId: "",
    googleAndroidPackageName: "com.kritamcqs.androidapp",
    googleAndroidSha1: "CE:34:23:0A:77:79:E5:01:09:10:2C:3C:A9:9C:B3:BF:7B:FD:AF:C4",
    googleClientSecret: "",
    googleRedirectUrls: [],
    googleCallbackUrl: "",
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

  return (
    <div className="flex flex-col gap-6">
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <div className={ui.eyebrow}>Security</div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Authentication Settings</h1>
            <p className={ui.muted}>Control login methods, Google OAuth, SMTP delivery, OTP policy, and session rules.</p>
          </div>
          <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={saving} onClick={saveSettings}>
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </section>

      <section className={ui.panel}>
        <h3 className="mb-4 text-xl font-bold text-slate-900">Login Methods</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-sm border border-slate-200 bg-slate-50 p-4">
            <ToggleSwitch checked={auth.emailPasswordEnabled} onChange={(value) => setAuth((current) => ({ ...current, emailPasswordEnabled: value }))} label="Email / Password Login" />
          </div>
          <div className="rounded-sm border border-slate-200 bg-slate-50 p-4">
            <ToggleSwitch checked={auth.googleEnabled} onChange={(value) => setAuth((current) => ({ ...current, googleEnabled: value }))} label="Google Login" />
          </div>
          <div className="rounded-sm border border-slate-200 bg-slate-50 p-4">
            <ToggleSwitch checked={auth.profileMobileRequired} onChange={(value) => setAuth((current) => ({ ...current, profileMobileRequired: value }))} label="Require Mobile On Profile Completion" />
          </div>
        </div>
      </section>

      <section className={ui.panel}>
        <h3 className="mb-4 text-xl font-bold text-slate-900">Login / Signup Consent</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-sm border border-slate-200 bg-slate-50 p-4">
            <ToggleSwitch checked={auth.consentEnabled} onChange={(value) => setAuth((current) => ({ ...current, consentEnabled: value }))} label="Show agreement checkbox" />
          </div>
          <div className="rounded-sm border border-slate-200 bg-slate-50 p-4">
            <ToggleSwitch checked={auth.consentRequiredForLogin} onChange={(value) => setAuth((current) => ({ ...current, consentRequiredForLogin: value }))} label="Require on Login" />
          </div>
          <div className="rounded-sm border border-slate-200 bg-slate-50 p-4">
            <ToggleSwitch checked={auth.consentRequiredForSignup} onChange={(value) => setAuth((current) => ({ ...current, consentRequiredForSignup: value }))} label="Require on Signup" />
          </div>
          <label className={ui.field}>
            <span>Button Behavior</span>
            <select className={ui.input} value={auth.consentButtonBehavior || "disable_until_checked"} onChange={(event) => setAuth((current) => ({ ...current, consentButtonBehavior: event.target.value }))}>
              <option value="disable_until_checked">Disable button until checked</option>
              <option value="show_error_on_submit">Show error on submit</option>
            </select>
          </label>
          <label className={cn(ui.field, "md:col-span-2")}>
            <span>Agreement Text</span>
            <textarea className={ui.textarea} value={auth.consentText || ""} onChange={(event) => setAuth((current) => ({ ...current, consentText: event.target.value }))} />
          </label>
          <label className={cn(ui.field, "md:col-span-2")}>
            <span>Policy Page Slugs</span>
            <input className={ui.input} value={(auth.consentPolicySlugs || []).join(", ")} onChange={(event) => setAuth((current) => ({ ...current, consentPolicySlugs: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} placeholder="terms, privacy, refund" />
          </label>
        </div>
      </section>

      <section className={ui.panel}>
        <div className="mb-5">
          <h3 className="text-xl font-bold text-slate-900">Google OAuth</h3>
          <p className={ui.muted}>Use a Web OAuth client for ID tokens, plus an Android OAuth client with the app package and signing fingerprints.</p>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Web Application</p>
              <h4 className="mt-1 text-lg font-bold text-slate-950">Web Google Login</h4>
              <p className="mt-1 text-sm text-slate-600">Used by browser Google sign-in and as the Android server client ID for ID tokens.</p>
            </div>
            <div className="grid gap-4">
              <label className={ui.field}><span>Web Google Client ID</span><input className={ui.input} value={auth.googleClientId || ""} onChange={(event) => setAuth((current) => ({ ...current, googleClientId: event.target.value }))} /></label>
              <label className={ui.field}>
                <span className="flex items-center justify-between gap-3">
                  <span>Web Google Client Secret</span>
                  <button type="button" className="text-sm font-medium text-slate-500 hover:text-slate-900" onClick={() => setShowGoogleSecret((current) => !current)}>{showGoogleSecret ? "Hide" : "Show"}</button>
                </span>
                <div className="relative">
                  <input
                    className={ui.input}
                    type={showGoogleSecret ? "text" : "password"}
                    placeholder={auth.googleClientSecretConfigured ? "Configured - enter only to replace" : ""}
                    value={auth.googleClientSecret || ""}
                    onChange={(event) => setAuth((current) => ({ ...current, googleClientSecret: event.target.value }))}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" onClick={() => setShowGoogleSecret((current) => !current)}>
                    <EyeIcon size={18} />
                  </button>
                </div>
              </label>
              <label className={ui.field}><span>Web Redirect URL</span><input className={ui.input} value={(auth.googleRedirectUrls || [])[0] || ""} onChange={(event) => setAuth((current) => ({ ...current, googleRedirectUrls: [event.target.value] }))} /></label>
              <label className={ui.field}><span>Web Callback URL</span><input className={ui.input} value={auth.googleCallbackUrl || ""} onChange={(event) => setAuth((current) => ({ ...current, googleCallbackUrl: event.target.value }))} /></label>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Android Application</p>
              <h4 className="mt-1 text-lg font-bold text-slate-950">Android Google Login</h4>
              <p className="mt-1 text-sm text-slate-600">Used by Google to authorize the Android package and signing certificate.</p>
            </div>
            <div className="grid gap-4">
              <label className={ui.field}><span>Android Google Client ID</span><input className={ui.input} value={auth.googleAndroidClientId || ""} onChange={(event) => setAuth((current) => ({ ...current, googleAndroidClientId: event.target.value }))} /></label>
              <label className={ui.field}><span>Android Package Name</span><input className={ui.input} value={auth.googleAndroidPackageName || ""} onChange={(event) => setAuth((current) => ({ ...current, googleAndroidPackageName: event.target.value }))} /></label>
              <label className={ui.field}><span>Android SHA-1 Fingerprint</span><input className={ui.input} value={auth.googleAndroidSha1 || ""} onChange={(event) => setAuth((current) => ({ ...current, googleAndroidSha1: event.target.value.toUpperCase() }))} /></label>
              <div className="rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-700">
                Android sign-in requests ID tokens with the Web Client ID. Keep the Android OAuth client in the same Google project with this package name and SHA-1/SHA-256 fingerprints.
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-5">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">iOS Application</p>
              <h4 className="mt-1 text-lg font-bold text-slate-950">iOS Google Login</h4>
              <p className="mt-1 text-sm text-slate-600">Used by native iOS builds to authorize the bundle ID and URL scheme.</p>
            </div>
            <div className="grid gap-4">
              <label className={ui.field}><span>iOS Google Client ID</span><input className={ui.input} value={auth.googleIosClientId || ""} onChange={(event) => setAuth((current) => ({ ...current, googleIosClientId: event.target.value }))} /></label>
              <div className="rounded-lg border border-sky-200 bg-white px-4 py-3 text-sm text-slate-700">
                Keep this iOS OAuth client in the same Google Cloud project as the Web client. The native app should use the Web Client ID as the server client ID for backend token verification.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={ui.panel}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="mb-2 text-xl font-bold text-slate-900">SMTP Configuration</h3>
            <p className={ui.muted}>Configure the sender address and encryption settings used for email delivery.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={testSmtpConnection} disabled={testing}>
              {testing ? "Testing..." : "Test SMTP Connection"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <label className={ui.field}><span>SMTP Host</span><input className={ui.input} value={smtp.host || ""} onChange={(event) => setSmtp((current) => ({ ...current, host: event.target.value }))} /></label>
          <label className={ui.field}><span>SMTP Port</span><input className={ui.input} type="number" value={smtp.port || 587} onChange={(event) => setSmtp((current) => ({ ...current, port: Number(event.target.value) }))} /></label>
          <label className={ui.field}><span>SMTP Email / User</span><input className={ui.input} value={smtp.user || ""} onChange={(event) => setSmtp((current) => ({ ...current, user: event.target.value }))} /></label>
          <label className={ui.field}>
            <span className="flex items-center justify-between gap-3">
              <span>SMTP Password</span>
              <button type="button" className="text-sm font-medium text-slate-500 hover:text-slate-900" onClick={() => setShowSmtpPassword((current) => !current)}>{showSmtpPassword ? "Hide" : "Show"}</button>
            </span>
            <div className="relative">
              <input
                className={ui.input}
                type={showSmtpPassword ? "text" : "password"}
                placeholder={smtp.hasPassword ? "Configured - enter only to replace" : ""}
                value={smtp.pass || ""}
                onChange={(event) => setSmtp((current) => ({ ...current, pass: event.target.value }))}
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" onClick={() => setShowSmtpPassword((current) => !current)}>
                <EyeIcon size={18} />
              </button>
            </div>
          </label>
          <label className={ui.field}><span>From Email</span><input className={ui.input} type="email" value={smtp.fromEmail || ""} onChange={(event) => setSmtp((current) => ({ ...current, fromEmail: event.target.value }))} /></label>
          <label className={ui.field}><span>Sender Name</span><input className={ui.input} value={smtp.fromName || ""} onChange={(event) => setSmtp((current) => ({ ...current, fromName: event.target.value }))} /></label>
          <label className={ui.field}><span>Encryption Type</span>
            <select
              className={ui.input}
              value={smtp.secure ? "ssl" : "starttls"}
              onChange={(event) => setSmtp((current) => ({ ...current, secure: event.target.value === "ssl" }))}
            >
              <option value="starttls">TLS / STARTTLS</option>
              <option value="ssl">SSL (implicit TLS)</option>
            </select>
          </label>
          <label className={ui.field}><span>Test Recipient</span><input className={ui.input} type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder={smtp.fromEmail || "recipient@example.com"} /></label>
        </div>
      </section>

      <section className={ui.panel}>
        <h3 className="mb-4 text-xl font-bold text-slate-900">Security Rules</h3>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Password Rules</h4>
              <p className="mt-2 text-sm text-slate-600">Minimum 8 characters, with uppercase, lowercase, and at least one number.</p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <label className={ui.field}><span>OTP Expiry Minutes</span><input className={ui.input} type="number" min="1" max="60" value={auth.resetOtpExpiryMinutes || 10} onChange={(event) => setAuth((current) => ({ ...current, resetOtpExpiryMinutes: Number(event.target.value) }))} /></label>
          <label className={ui.field}><span>OTP Attempts</span><input className={ui.input} type="number" min="1" max="10" value={auth.resetOtpMaxAttempts || 5} onChange={(event) => setAuth((current) => ({ ...current, resetOtpMaxAttempts: Number(event.target.value) }))} /></label>
          <label className={ui.field}><span>OTP Resends</span><input className={ui.input} type="number" min="1" max="10" value={auth.resetOtpMaxResends || 3} onChange={(event) => setAuth((current) => ({ ...current, resetOtpMaxResends: Number(event.target.value) }))} /></label>
          <label className={ui.field}><span>Session Timeout Minutes</span><input className={ui.input} type="number" min="15" value={auth.sessionTimeoutMinutes || 43200} onChange={(event) => setAuth((current) => ({ ...current, sessionTimeoutMinutes: Number(event.target.value) }))} /></label>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className={ui.field}><span>Reset OTP Email Subject</span><input className={ui.input} value={auth.resetOtpEmailSubject || ""} onChange={(event) => setAuth((current) => ({ ...current, resetOtpEmailSubject: event.target.value }))} /></label>
          <label className={ui.field}><span>Reset OTP Email Template</span><textarea className={cn(ui.input, "min-h-28")} value={auth.resetOtpEmailTemplate || ""} onChange={(event) => setAuth((current) => ({ ...current, resetOtpEmailTemplate: event.target.value }))} /></label>
        </div>
      </section>
    </div>
  );
}
