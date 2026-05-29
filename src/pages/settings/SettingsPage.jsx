import { useEffect, useMemo, useRef, useState } from "react";
import { useThemePreference } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { subscriptionService } from "../../api/subscriptionService";
import { http } from "../../api/http";
import { cn, ui } from "../../ui";

const options = [
  {
    value: "system",
    title: "System Default",
    description: "Follow your device or browser preference automatically.",
  },
  {
    value: "light",
    title: "Light Mode",
    description: "Use the light interface across the admin panel.",
  },
  {
    value: "dark",
    title: "Dark Mode",
    description: "Use the dark interface across the admin panel.",
  },
];

export function SettingsPage() {
  const { themePreference, resolvedTheme, setThemePreference } = useThemePreference();
  const { admin, logout, token } = useAuth();
  const logoInputRef = useRef(null);
  const [appSettings, setAppSettings] = useState({ appName: "Krita NEET JEE", logoUrl: "" });
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoError, setLogoError] = useState("");

  useEffect(() => {
    let mounted = true;

    subscriptionService
      .getAppSettings()
      .then((response) => {
        if (mounted) setAppSettings(response.data || response);
      })
      .catch((error) => {
        if (mounted) setLogoError(error.message || "Unable to load app settings");
      });

    return () => {
      mounted = false;
    };
  }, []);

  const logoPreviewUrl = useMemo(() => {
    const raw = String(appSettings?.logoUrl || "").trim();
    if (!raw) return "";
    if (/^(https?:)?\/\//i.test(raw) || raw.startsWith("data:")) return raw;
    const apiRoot = String(http.defaults.baseURL || "").replace(/\/api\/?$/, "");
    return raw.startsWith("/") ? `${apiRoot}${raw}` : raw;
  }, [appSettings?.logoUrl]);

  const runtimeInfo = useMemo(
    () => [
      ["API Base URL", import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api"],
      ["Resolved Theme", resolvedTheme],
      ["Saved Preference", themePreference],
      ["Session", token ? "Authenticated" : "Not signed in"],
    ],
    [resolvedTheme, themePreference, token],
  );

  const profileInfo = useMemo(
    () => [
      ["Admin Name", admin?.name || "Administrator"],
      ["Email", admin?.email || "-"],
      ["Mobile", admin?.mobile || "-"],
      ["Role", admin?.isAdmin ? "Super Admin" : "Admin"],
    ],
    [admin],
  );

  async function handleLogoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLogoBusy(true);
      setLogoError("");
      const response = await subscriptionService.uploadAppLogo(file);
      setAppSettings(response.data || response);
    } catch (error) {
      setLogoError(error.message || "Logo upload failed");
    } finally {
      setLogoBusy(false);
      event.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <div className={ui.eyebrow}>Preferences</div>
            <h1 className="mb-1 text-3xl font-black tracking-tight text-slate-900">Settings</h1>
            <p className={ui.muted}>
              Manage workspace appearance, session information, and admin runtime settings.
            </p>
          </div>
          <div className={ui.badge}>Active theme: {resolvedTheme}</div>
        </div>
      </div>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Appearance</h3>
            <p className={ui.muted}>Select how the admin interface should render for this browser session.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(ui.moduleCard, themePreference === option.value && "ring-2 ring-blue-300 bg-blue-50/70")}
              onClick={() => setThemePreference(option.value)}
            >
              <div className={ui.metricTop}>
                <span className={ui.metricLabel}>{option.value}</span>
                {themePreference === option.value ? <span className={ui.pill}>Selected</span> : null}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{option.title}</h3>
              <p className={ui.muted}>{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Application Logo</h3>
            <p className={ui.muted}>Upload the logo used by the mobile app splash screen, login page, and header.</p>
          </div>
          <button
            className={cn(ui.buttonBase, ui.buttonPrimary)}
            disabled={logoBusy}
            type="button"
            onClick={() => logoInputRef.current?.click()}
          >
            {logoBusy ? "Uploading..." : "Upload Logo"}
          </button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-24 w-56 items-center justify-center rounded-sm border border-slate-200 bg-slate-50 p-4">
            {logoPreviewUrl ? (
              <img className="max-h-full max-w-full object-contain" src={logoPreviewUrl} alt={`${appSettings.appName || "Application"} logo`} />
            ) : (
              <span className="text-sm font-semibold text-slate-400">No logo uploaded</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{appSettings.appName || "Krita NEET JEE"}</p>
            <p className={ui.muted}>{appSettings.logoUrl || "Using bundled app fallback until a logo is uploaded."}</p>
            {logoError ? <p className="mt-2 text-sm font-semibold text-red-600">{logoError}</p> : null}
          </div>
        </div>

        <input
          ref={logoInputRef}
          className="hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleLogoUpload}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className={ui.panel}>
          <div className={ui.sectionHead}>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Admin Profile</h3>
              <p className={ui.muted}>Current authenticated workspace user information.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {profileInfo.map(([label, value]) => (
              <div key={label} className="rounded-sm border border-slate-200/80 bg-slate-50/80 p-4">
                <span className={ui.muted}>{label}</span>
                <strong className="mt-2 block text-lg font-bold text-slate-900">{value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className={ui.panel}>
          <div className={ui.sectionHead}>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Runtime Info</h3>
              <p className={ui.muted}>Useful environment values for the current admin deployment.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {runtimeInfo.map(([label, value]) => (
              <div key={label} className="rounded-sm border border-slate-200/80 bg-slate-50/80 p-4">
                <span className={ui.muted}>{label}</span>
                <strong className="mt-2 block text-lg font-bold text-slate-900">{value}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Workspace Actions</h3>
            <p className={ui.muted}>Quick controls for this admin browser session.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} type="button" onClick={() => setThemePreference("system")}>
            Reset Theme Preference
          </button>
          <button className={cn(ui.buttonBase, ui.buttonGhost)} type="button" onClick={() => window.location.reload()}>
            Reload Admin App
          </button>
          <button className={cn(ui.buttonBase, ui.buttonDanger)} type="button" onClick={logout}>
            Sign Out
          </button>
        </div>
      </section>
    </div>
  );
}
