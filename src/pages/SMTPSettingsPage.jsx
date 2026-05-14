import { useEffect, useState } from "react";
import { subscriptionService } from "../api/subscriptionService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ToggleSwitch } from "../components/forms/ToggleSwitch";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

export function SMTPSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [smtp, setSmtp] = useState({});
  const [testEmail, setTestEmail] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await subscriptionService.getInvoiceSettings();
      const data = response.data || {};
      setSettings(data);
      setSmtp(data.smtp || {});
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await subscriptionService.saveInvoiceSettings({ ...settings, smtp });
      toast.success("SMTP settings saved");
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function sendTestEmail() {
    try {
      await subscriptionService.testInvoiceEmail({ to: testEmail || smtp.fromEmail });
      toast.success("Test email processed");
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (loading || !settings) return <LoadingSpinner label="Loading SMTP settings..." />;

  return (
    <form className="flex flex-col gap-6" onSubmit={save}>
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <div className={ui.eyebrow}>Email Configuration</div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">SMTP Settings</h2>
            <p className={ui.muted}>Configure the sender used for invoice emails and subscription expiry reminder emails.</p>
          </div>
          <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={saving} type="submit">
            {saving ? "Saving..." : "Save SMTP"}
          </button>
        </div>
      </section>

      <section className={ui.panel}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            ["host", "SMTP Host"],
            ["port", "Port"],
            ["user", "Username"],
            ["pass", "Password"],
            ["fromName", "From Name"],
            ["fromEmail", "From Email"],
          ].map(([key, label]) => (
            <label className={ui.field} key={key}>
              <span>{label}</span>
              <input
                className={ui.input}
                type={key === "pass" ? "password" : key === "fromEmail" ? "email" : "text"}
                value={smtp?.[key] || ""}
                onChange={(event) => setSmtp((current) => ({ ...current, [key]: event.target.value }))}
                placeholder={key === "pass" && smtp?.hasPassword ? "Leave blank to keep saved password" : ""}
              />
            </label>
          ))}
          <label className={ui.field}>
            <span>Encryption Type</span>
            <select
              className={ui.input}
              value={smtp?.secure ? "ssl" : "starttls"}
              onChange={(event) => setSmtp((current) => ({ ...current, secure: event.target.value === "ssl" }))}
            >
              <option value="starttls">STARTTLS / TLS</option>
              <option value="ssl">SSL</option>
              <option value="none">None</option>
            </select>
          </label>
          <label className={ui.field}>
            <span>Secure TLS</span>
            <div className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 py-3">
              <ToggleSwitch checked={Boolean(smtp?.secure)} onChange={(value) => setSmtp((current) => ({ ...current, secure: value }))} label="Use direct TLS, usually port 465" />
            </div>
          </label>
          <label className={ui.field}>
            <span>Test Recipient</span>
            <input className={ui.input} type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder={smtp?.fromEmail || "admin@example.com"} />
          </label>
          <div className="flex items-end">
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} type="button" onClick={sendTestEmail}>Test Email</button>
          </div>
        </div>
      </section>
    </form>
  );
}
