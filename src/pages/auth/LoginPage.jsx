import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authService } from "../../api/authService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { cn, ui } from "../../ui";

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

  if (statusLoading) {
    return <div className="flex min-h-screen items-center justify-center px-4 py-10"><div className={cn(ui.panel, "w-full max-w-2xl")}>Checking admin status...</div></div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className={cn(ui.panel, "w-full max-w-2xl")}>
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Krita Admin Panel</h1>
            <p className={ui.muted}>Manage catalog, questions, users, and admin insights.</p>
          </div>

          {hasAdmin ? (
            <>
              <div className="flex items-center gap-3">
                <button
                  className={cn(ui.buttonBase, authMode === "login" ? ui.buttonPrimary : ui.buttonSecondary)}
                  disabled={Boolean(pendingAction)}
                  onClick={() => setAuthMode("login")}
                  type="button"
                >
                  Login
                </button>
                {/* <button
                  className={cn(ui.buttonBase, authMode === "register" ? ui.buttonPrimary : ui.buttonSecondary)}
                  disabled={Boolean(pendingAction)}
                  onClick={() => setAuthMode("register")}
                  type="button"
                >
                  Register
                </button> */}
              </div>
              {authMode === "login" ? (
            <form className="flex flex-col gap-6" onSubmit={handleLogin}>
              <label className={ui.field}>
                <span>Email or Mobile</span>
                <input
                  autoComplete="username"
                  className={ui.input}
                  placeholder="admin@email.com or 9876543210"
                  value={loginForm.identifier}
                  onChange={(event) => setLoginForm((current) => ({ ...current, identifier: event.target.value }))}
                />
              </label>
              <label className={ui.field}>
                <span>Password</span>
                <input
                  autoComplete="current-password"
                  className={ui.input}
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                />
              </label>
              <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={!canSubmitLogin} type="submit">
                {pendingAction === "login" ? "Logging in..." : "Login"}
              </button>
            </form>
              ) : (
            <form className="flex flex-col gap-6" onSubmit={handleRegister}>
              <p className={ui.muted}>Register a new admin account.</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className={ui.field}><span>Name</span><input className={ui.input} value={bootstrapForm.name} onChange={(event) => setBootstrapForm((current) => ({ ...current, name: event.target.value }))} /></label>
                <label className={ui.field}><span>Mobile</span><input className={ui.input} inputMode="numeric" value={bootstrapForm.mobile} onChange={(event) => setBootstrapForm((current) => ({ ...current, mobile: sanitizeMobile(event.target.value) }))} /></label>
                <label className={ui.field}><span>Email</span><input className={ui.input} autoComplete="email" value={bootstrapForm.email} onChange={(event) => setBootstrapForm((current) => ({ ...current, email: event.target.value }))} /></label>
                <label className={ui.field}><span>Password</span><input className={ui.input} autoComplete="new-password" type="password" value={bootstrapForm.password} onChange={(event) => setBootstrapForm((current) => ({ ...current, password: event.target.value }))} /></label>
              </div>
              <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={!canSubmitBootstrap} type="submit">
                {pendingAction === "register" ? "Registering..." : "Register Admin"}
              </button>
            </form>
              )}
            </>
          ) : (
            <form className="flex flex-col gap-6" onSubmit={handleBootstrap}>
              <p className={ui.muted}>No admin exists yet. Bootstrap the first admin account.</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className={ui.field}><span>Name</span><input className={ui.input} value={bootstrapForm.name} onChange={(event) => setBootstrapForm((current) => ({ ...current, name: event.target.value }))} /></label>
                <label className={ui.field}><span>Mobile</span><input className={ui.input} inputMode="numeric" value={bootstrapForm.mobile} onChange={(event) => setBootstrapForm((current) => ({ ...current, mobile: sanitizeMobile(event.target.value) }))} /></label>
                <label className={ui.field}><span>Email</span><input className={ui.input} autoComplete="email" value={bootstrapForm.email} onChange={(event) => setBootstrapForm((current) => ({ ...current, email: event.target.value }))} /></label>
                <label className={ui.field}><span>Password</span><input className={ui.input} autoComplete="new-password" type="password" value={bootstrapForm.password} onChange={(event) => setBootstrapForm((current) => ({ ...current, password: event.target.value }))} /></label>
              </div>
              <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={!canSubmitBootstrap} type="submit">
                {pendingAction === "bootstrap" ? "Creating..." : "Create Admin"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
