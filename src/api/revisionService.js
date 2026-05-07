import { http } from "./http";

export const revisionService = {
  async getSettings() {
    const response = await http.get("/admin/revision/settings");
    return response.data;
  },
  async saveSettings(payload) {
    const response = await http.post("/admin/revision/settings", payload);
    return response.data;
  },
  async getAnalytics() {
    const response = await http.get("/admin/revision/analytics");
    return response.data;
  },
  async generatePool(payload = {}) {
    const response = await http.post("/admin/revision/generate", payload);
    return response.data;
  },
};

