import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../api/authService";
import { setUnauthorizedHandler } from "../api/http";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("krita_admin_token"));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("krita_admin_token")));

  function clearSession() {
    localStorage.removeItem("krita_admin_token");
    localStorage.removeItem("krita_admin_user");
    setToken(null);
    setAdmin(null);
  }

  async function logout(options = {}) {
    if (options.remote !== false && token) {
      await authService.logout().catch(() => undefined);
    }
    clearSession();
  }

  async function refreshAdmin() {
    if (!localStorage.getItem("krita_admin_token")) return null;
    const response = await authService.me();
    localStorage.setItem("krita_admin_user", JSON.stringify(response.data));
    setAdmin(response.data);
    return response.data;
  }

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });
  }, []);

  useEffect(() => {
    async function hydrate() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await refreshAdmin();
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    }

    hydrate();
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    const handleFocus = () => {
      refreshAdmin().catch(() => undefined);
    };
    const interval = window.setInterval(handleFocus, 60000);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [token]);

  function persistSession(nextToken, nextAdmin) {
    localStorage.setItem("krita_admin_token", nextToken);
    localStorage.setItem("krita_admin_user", JSON.stringify(nextAdmin));
    setToken(nextToken);
    setAdmin(nextAdmin);
  }

  async function login(values) {
    const response = await authService.login(values);
    persistSession(response.data.token, response.data.admin);
    return response.data;
  }

  async function bootstrap(values) {
    const response = await authService.bootstrap(values);
    persistSession(response.data.token, response.data.admin);
    return response.data;
  }

  async function register(values) {
    const response = await authService.register(values);
    persistSession(response.data.token, response.data.admin);
    return response.data;
  }

  const value = useMemo(
    () => ({
      admin,
      token,
      loading,
      isAuthenticated: Boolean(token && admin),
      login,
      bootstrap,
      register,
      refreshAdmin,
      logout,
    }),
    [admin, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
