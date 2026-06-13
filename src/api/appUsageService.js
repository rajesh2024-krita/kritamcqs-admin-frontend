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
};
