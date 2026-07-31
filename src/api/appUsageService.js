import { http } from "./http";

export const appUsageService = {
  async settings() {
    const response = await http.get("/admin/app-usage/settings");
    return response.data;
  },
  async saveSettings(payload) {
    const response = await http.post("/admin/app-usage/settings", payload);
    return response.data;
  },
  async analytics(params = {}) {
    const response = await http.get("/admin/app-usage/analytics", { params });
    return response.data;
  },
  async users(params = {}) {
    const response = await http.get("/admin/app-usage/users", { params });
    return response.data;
  },
  async sessions(params = {}) {
    const response = await http.get("/admin/app-usage/sessions", { params });
    return response.data;
  },
  async events(params = {}) {
    const response = await http.get("/admin/app-usage/events", { params });
    return response.data;
  },
  async screens(params = {}) {
    const response = await http.get("/admin/app-usage/screens", { params });
    return response.data;
  },
  async devices(params = {}) {
    const response = await http.get("/admin/app-usage/devices", { params });
    return response.data;
  },
  async userTimeline(userId, params = {}) {
    const response = await http.get(`/admin/app-usage/users/${encodeURIComponent(userId)}/timeline`, { params });
    return response.data;
  },
  async userActivity(userId, params = {}) {
    const response = await http.get(`/admin/app-usage/users/${encodeURIComponent(userId)}/activity`, { params });
    return response.data;
  },
  async session(sessionId) {
    const response = await http.get(`/admin/app-usage/sessions/${sessionId}`);
    return response.data;
  },
  exportUrl(params = {}) {
    const query = new URLSearchParams(params).toString();
    const base = http.defaults.baseURL || "";
    return `${base}/admin/app-usage/export${query ? `?${query}` : ""}`;
  },
  async deleteLogs(payload) {
    const response = await http.delete("/admin/app-usage/logs", { data: payload });
    return response.data;
  },
};
