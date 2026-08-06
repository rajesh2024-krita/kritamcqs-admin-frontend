import { http } from "./http";

export const subscriptionReminderService = {
  async freeUserCta() {
    const response = await http.get("/admin/free-user-subscription-cta");
    return response.data;
  },
  async saveFreeUserCta(payload) {
    const response = await http.put("/admin/free-user-subscription-cta", payload);
    return response.data;
  },
  async stats() {
    const response = await http.get("/admin/subscription-reminder/statistics");
    return response.data;
  },
  async configurations(params = {}) {
    const response = await http.get("/admin/subscription-reminder/configurations", { params: { page: 1, limit: 10, ...params } });
    return response.data;
  },
  async createConfiguration(payload) {
    const response = await http.post("/admin/subscription-reminder/configurations", payload);
    return response.data;
  },
  async updateConfiguration(id, payload) {
    const response = await http.put(`/admin/subscription-reminder/configurations/${id}`, payload);
    return response.data;
  },
  async deleteConfiguration(id) {
    const response = await http.delete(`/admin/subscription-reminder/configurations/${id}`);
    return response.data;
  },
  async setConfigurationStatus(id, status) {
    const response = await http.patch("/admin/subscription-reminder/configurations/status", { id, status });
    return response.data;
  },
  async cancelledUsers(params = {}) {
    const response = await http.get("/admin/subscription-reminder/cancelled-users", { params: { page: 1, limit: 10, ...params } });
    return response.data;
  },
  async stop(id) {
    const response = await http.patch(`/admin/subscription-reminder/cancelled-users/${id}/stop`);
    return response.data;
  },
  async restart(id) {
    const response = await http.patch(`/admin/subscription-reminder/cancelled-users/${id}/restart`);
    return response.data;
  },
  async logs(params = {}) {
    const response = await http.get("/admin/subscription-reminder/logs", { params: { page: 1, limit: 10, ...params } });
    return response.data;
  },
};
