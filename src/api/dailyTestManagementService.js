import { http } from "./http";

export const dailyTestManagementService = {
  async getSettings() {
    const response = await http.get("/admin/daily-test/settings");
    return response.data;
  },
  async saveSettings(payload) {
    const response = await http.post("/admin/daily-test/settings", payload);
    return response.data;
  },
  async getAnalytics() {
    const response = await http.get("/admin/daily-test/analytics");
    return response.data;
  },
  async resetDailyTests(payload = {}) {
    const response = await http.post("/admin/daily-test/reset", payload);
    return response.data;
  },
};

