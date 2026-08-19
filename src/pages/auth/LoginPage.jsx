import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authService } from "../../api/authService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { cn, ui } from "../../ui";
import {
  LogIn,
  UserPlus,
  Shield,
  Mail,
  Phone,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Award,
  Crown,
  Star,
  TrendingUp,
  BarChart3,
  BookOpen,
  Layers,
  Users,
  Settings,
  Database,
  Server,
  Globe,
  Smartphone,
  Tablet,
  Monitor,
  Key,
  Fingerprint,
  Scan,
  ShieldCheck,
  Lock as LockIcon,
  Unlock,
  Check,
  X
} from "lucide-react";

const bootstrapDefaults = {
  mobile: "",
  email: "",
  name: "",
  password: "",
  examMode: "BOTH",
  level: "Topper",
};

function sanitizeMobile(value) {
  return value.replace(/\D/g, "").slice(0, 15);
}

function sanitizeIdentifier(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  return sanitizeMobile(trimmed);
}

function normalizeBootstrapForm(values) {
  return {
    ...values,
    name: values.name.trim(),
    mobile: sanitizeMobile(values.mobile),
    email: values.email.trim().toLowerCase(),
    password: values.password.trim(),
  };
}

export function LoginPage() {
  const { isAuthenticated, login, bootstrap, register } = useAuth();
  const toast = useToast();
  const [statusLoading, setStatusLoading] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ identifier: "", password: "" });
  const [bootstrapForm, setBootstrapForm] = useState(bootstrapDefaults);
  const [pendingAction, setPendingAction] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const loginIdentifier = sanitizeIdentifier(loginForm.identifier);
  const canSubmitLogin = Boolean(loginIdentifier && loginForm.password.trim().length >= 8 && !pendingAction);
  const normalizedBootstrapForm = normalizeBootstrapForm(bootstrapForm);
  const canSubmitBootstrap = Boolean(
    normalizedBootstrapForm.name.length >= 2 &&
      normalizedBootstrapForm.mobile.length >= 10 &&
      normalizedBootstrapForm.password.length >= 8 &&
      !pendingAction,
  );

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await authService.status();
        setHasAdmin(response.data.hasAdmin);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setStatusLoading(false);
      }
    }
    fetchStatus();
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleLogin(event) {
    event.preventDefault();
    if (!canSubmitLogin) return;
    try {
      setPendingAction("login");
      await login({ identifier: loginIdentifier, password: loginForm.password.trim() });
      toast.success("Welcome back");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleBootstrap(event) {
    event.preventDefault();
    if (!canSubmitBootstrap) return;
    try {
      setPendingAction("bootstrap");
      await bootstrap(normalizedBootstrapForm);
      toast.success("Admin account created");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    if (!canSubmitBootstrap) return;
    try {
      setPendingAction("register");
      await register(normalizedBootstrapForm);
      toast.success("Admin account registered");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPendingAction(null);
    }
  }

  // Compact input classes
  const compactInput = "w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400";

  if (statusLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-4">
        <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-sm text-slate-600">Checking admin status...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-4 py-10">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-200/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-2xl shadow-slate-200/50 p-6">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/25 mb-4">
              <Shield size={28} className="text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">Krita Admin Panel</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage catalog, questions, users, and insights</p>
          </div>

          {hasAdmin ? (
            <>
              {/* Auth Mode Tabs */}
              <div className="flex rounded-lg bg-slate-100 p-0.5 mb-4">
                <button
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                    authMode === "login"
                      ? "bg-white shadow-sm text-indigo-700"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                  disabled={Boolean(pendingAction)}
                  onClick={() => setAuthMode("login")}
                  type="button"
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <LogIn size={14} />
                    Login
                  </span>
                </button>
                {/* <button
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                    authMode === "register"
                      ? "bg-white shadow-sm text-indigo-700"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                  disabled={Boolean(pendingAction)}
                  onClick={() => setAuthMode("register")}
                  type="button"
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <UserPlus size={14} />
                    Register
                  </span>
                </button> */}
              </div>

              {/* Login Form */}
              {authMode === "login" && (
                <form className="space-y-3" onSubmit={handleLogin}>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">
                      Email or Mobile
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {loginForm.identifier.includes("@") ? (
                          <Mail size={16} />
                        ) : (
                          <Phone size={16} />
                        )}
                      </div>
                      <input
                        autoComplete="username"
                        className={cn(compactInput, "pl-10")}
                        placeholder="admin@email.com or 9876543210"
                        value={loginForm.identifier}
                        onChange={(event) => setLoginForm((current) => ({ ...current, identifier: event.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Lock size={16} />
                      </div>
                      <input
                        autoComplete="current-password"
                        className={cn(compactInput, "pl-10 pr-10")}
                        type={showPassword ? "text" : "password"}
                        value={loginForm.password}
                        onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {/* <div className="flex justify-end">
                      <button type="button" className="text-[9px] text-indigo-600 hover:text-indigo-700 transition-colors">
                        Forgot password?
                      </button>
                    </div> */}
                  </div>

                  <button
                    className={cn(
                      "w-full py-2 text-xs font-medium rounded-lg transition-all",
                      canSubmitLogin
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm shadow-indigo-500/25"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    )}
                    disabled={!canSubmitLogin}
                    type="submit"
                  >
                    {pendingAction === "login" ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Logging in...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Login
                        <ArrowRight size={14} />
                      </span>
                    )}
                  </button>
                </form>
              )}

              {/* Register Form */}
              {authMode === "registerttt" && (
                <form className="space-y-3" onSubmit={handleRegister}>
                  <p className="text-[10px] text-slate-500 text-center">Register a new admin account</p>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Name</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <User size={16} />
                        </div>
                        <input
                          className={cn(compactInput, "pl-10")}
                          value={bootstrapForm.name}
                          onChange={(event) => setBootstrapForm((current) => ({ ...current, name: event.target.value }))}
                          placeholder="Full name"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Mobile</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Phone size={16} />
                        </div>
                        <input
                          className={cn(compactInput, "pl-10")}
                          inputMode="numeric"
                          value={bootstrapForm.mobile}
                          onChange={(event) => setBootstrapForm((current) => ({ ...current, mobile: sanitizeMobile(event.target.value) }))}
                          placeholder="9876543210"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Email</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Mail size={16} />
                        </div>
                        <input
                          className={cn(compactInput, "pl-10")}
                          autoComplete="email"
                          value={bootstrapForm.email}
                          onChange={(event) => setBootstrapForm((current) => ({ ...current, email: event.target.value }))}
                          placeholder="admin@email.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Password</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock size={16} />
                        </div>
                        <input
                          className={cn(compactInput, "pl-10 pr-10")}
                          autoComplete="new-password"
                          type={showPassword ? "text" : "password"}
                          value={bootstrapForm.password}
                          onChange={(event) => setBootstrapForm((current) => ({ ...current, password: event.target.value }))}
                          placeholder="Min 8 characters"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    className={cn(
                      "w-full py-2 text-xs font-medium rounded-lg transition-all",
                      canSubmitBootstrap
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm shadow-indigo-500/25"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    )}
                    disabled={!canSubmitBootstrap}
                    type="submit"
                  >
                    {pendingAction === "register" ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Registering...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Register Admin
                        <ArrowRight size={14} />
                      </span>
                    )}
                  </button>
                </form>
              )}
            </>
          ) : (
            // Bootstrap Form - No Admin Exists
            <form className="space-y-3" onSubmit={handleBootstrap}>
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
                <p className="text-[10px] text-amber-800">No admin exists yet. Bootstrap the first admin account.</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Name</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <User size={16} />
                    </div>
                    <input
                      className={cn(compactInput, "pl-10")}
                      value={bootstrapForm.name}
                      onChange={(event) => setBootstrapForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Full name"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Mobile</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Phone size={16} />
                    </div>
                    <input
                      className={cn(compactInput, "pl-10")}
                      inputMode="numeric"
                      value={bootstrapForm.mobile}
                      onChange={(event) => setBootstrapForm((current) => ({ ...current, mobile: sanitizeMobile(event.target.value) }))}
                      placeholder="9876543210"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Email</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      className={cn(compactInput, "pl-10")}
                      autoComplete="email"
                      value={bootstrapForm.email}
                      onChange={(event) => setBootstrapForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="admin@email.com"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock size={16} />
                    </div>
                    <input
                      className={cn(compactInput, "pl-10 pr-10")}
                      autoComplete="new-password"
                      type={showPassword ? "text" : "password"}
                      value={bootstrapForm.password}
                      onChange={(event) => setBootstrapForm((current) => ({ ...current, password: event.target.value }))}
                      placeholder="Min 8 characters"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              <button
                className={cn(
                  "w-full py-2 text-xs font-medium rounded-lg transition-all",
                  canSubmitBootstrap
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm shadow-indigo-500/25"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
                disabled={!canSubmitBootstrap}
                type="submit"
              >
                {pendingAction === "bootstrap" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create Admin
                    <ArrowRight size={14} />
                  </span>
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center justify-between">
            <span className="text-[8px] text-slate-400">Protected by</span>
            <div className="flex items-center gap-2">
              <ShieldCheck size={12} className="text-indigo-500" />
              <span className="text-[8px] font-medium text-slate-500">Secure Login</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}