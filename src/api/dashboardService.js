import { http } from "./http";

export const dashboardService = {
  async getStats() {
    const response = await http.get("/admin/stats");
    return response.data;
  },
  async getDashboard() {
    const response = await http.get("/admin/dashboard");
    return response.data;
  },
  async getCatalog() {
    const response = await http.get("/admin/catalog");
    return response.data;
  },
  async getDailyTestAnalytics(params = {}) {
    const response = await http.get("/admin/daily-test-analytics", { params });
    return response.data;
  },
};
