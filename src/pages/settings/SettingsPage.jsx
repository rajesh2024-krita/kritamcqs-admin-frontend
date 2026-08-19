import { useEffect, useMemo, useRef, useState } from "react";
import { useThemePreference } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { subscriptionService } from "../../api/subscriptionService";
import { http } from "../../api/http";
import { cn, ui } from "../../ui";
import {
  Settings,
  Sun,
  Moon,
  Monitor,
  Palette,
  Image,
  Upload,
  RefreshCw,
  LogOut,
  User,
  Mail,
  Phone,
  Shield,
  Database,
  Server,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Layout,
  TrendingUp,
  Award,
  Crown,
  Star,
  Sparkles,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  Fingerprint
} from "lucide-react";

const options = [
  {
    value: "system",
    title: "System Default",
    description: "Follow your device or browser preference automatically.",
    icon: Monitor,
  },
  {
    value: "light",
    title: "Light Mode",
    description: "Use the light interface across the admin panel.",
    icon: Sun,
  },
  {
    value: "dark",
    title: "Dark Mode",
    description: "Use the dark interface across the admin panel.",
    icon: Moon,
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

  // Compact input classes
  const compactInput = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <Settings size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Settings</h1>
              <p className="text-xs text-slate-500">Manage workspace appearance and preferences</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[8px] font-medium text-indigo-700">
              <Monitor size={9} />
              {resolvedTheme}
            </span>
          </div>
        </div>
      </div>

      {/* Theme Options */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Palette size={14} className="text-indigo-600" />
          <h2 className="text-xs font-semibold text-slate-900">Appearance</h2>
          <span className="text-[8px] text-slate-400">Select your preferred theme</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5 mt-2 sm:grid-cols-3">
          {options.map((option) => {
            const Icon = option.icon;
            const isActive = themePreference === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "rounded-lg border p-2.5 text-left transition-all",
                  isActive
                    ? "border-indigo-300 bg-indigo-50 shadow-sm ring-2 ring-indigo-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                )}
                onClick={() => setThemePreference(option.value)}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className={isActive ? "text-indigo-600" : "text-slate-400"} />
                  <span className="text-[10px] font-semibold text-slate-900">{option.title}</span>
                  {isActive && (
                    <span className="ml-auto inline-flex px-1.5 py-0.5 bg-indigo-600 rounded text-[6px] font-medium text-white">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[8px] text-slate-500 mt-0.5">{option.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Application Logo */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Image size={14} className="text-indigo-600" />
            <h2 className="text-xs font-semibold text-slate-900">Application Logo</h2>
            <span className="text-[8px] text-slate-400">App splash screen & header</span>
          </div>
          <button
            className={cn(
              "inline-flex items-center gap-0.5 px-2 py-0.5 text-[8px] font-medium rounded-lg transition-all",
              "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm shadow-indigo-500/25",
              logoBusy && "opacity-50 cursor-not-allowed"
            )}
            disabled={logoBusy}
            type="button"
            onClick={() => logoInputRef.current?.click()}
          >
            <Upload size={9} /> {logoBusy ? "Uploading..." : "Upload"}
          </button>
        </div>

        <div className="flex flex-col gap-3 mt-2 sm:flex-row sm:items-center">
          <div className="flex h-20 w-40 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3">
            {logoPreviewUrl ? (
              <img className="max-h-full max-w-full object-contain" src={logoPreviewUrl} alt={`${appSettings.appName || "Application"} logo`} />
            ) : (
              <span className="text-[8px] font-medium text-slate-400">No logo uploaded</span>
            )}
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-900">{appSettings.appName || "Krita NEET JEE"}</p>
            <p className="text-[8px] text-slate-500">{appSettings.logoUrl || "Using bundled app fallback until a logo is uploaded."}</p>
            {logoError && <p className="mt-1 text-[8px] font-medium text-rose-600">{logoError}</p>}
          </div>
        </div>

        <input
          ref={logoInputRef}
          className="hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleLogoUpload}
        />
      </div>

      {/* Admin Profile & Runtime Info */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Admin Profile */}
        <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <User size={14} className="text-indigo-600" />
            <h2 className="text-xs font-semibold text-slate-900">Admin Profile</h2>
            <span className="text-[8px] text-slate-400">Current session</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {profileInfo.map(([label, value]) => (
              <div key={label} className="bg-slate-50 rounded-lg border border-slate-200/50 p-2">
                <span className="text-[6px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
                <div className="text-[10px] font-semibold text-slate-900 mt-0.5 truncate">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Runtime Info */}
        <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Server size={14} className="text-indigo-600" />
            <h2 className="text-xs font-semibold text-slate-900">Runtime Info</h2>
            <span className="text-[8px] text-slate-400">Environment details</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {runtimeInfo.map(([label, value]) => (
              <div key={label} className="bg-slate-50 rounded-lg border border-slate-200/50 p-2">
                <span className="text-[6px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
                <div className="text-[10px] font-semibold text-slate-900 mt-0.5 truncate">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workspace Actions */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Zap size={14} className="text-indigo-600" />
          <h2 className="text-xs font-semibold text-slate-900">Workspace Actions</h2>
          <span className="text-[8px] text-slate-400">Quick controls</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <button
            className="inline-flex items-center gap-0.5 px-2.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded-lg transition-colors"
            type="button"
            onClick={() => setThemePreference("system")}
          >
            <RefreshCw size={9} /> Reset Theme
          </button>
          <button
            className="inline-flex items-center gap-0.5 px-2.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded-lg transition-colors"
            type="button"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={9} /> Reload App
          </button>
          <button
            className="inline-flex items-center gap-0.5 px-2.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[8px] font-medium rounded-lg transition-colors"
            type="button"
            onClick={logout}
          >
            <LogOut size={9} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}