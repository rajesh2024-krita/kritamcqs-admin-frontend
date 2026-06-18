import { http } from "./http";

export const notificationService = {
  async list(params = {}) {
    const response = await http.get("/admin/notifications", { params });
    return response.data;
  },
  async broadcast(formData) {
    const response = await http.post("/admin/notifications/broadcast", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  async stats() {
    const response = await http.get("/admin/notifications/stats");
    return response.data;
  },
  async templates() {
    const response = await http.get("/admin/notifications/templates");
    return response.data;
  },
  async users(params = {}) {
    const response = await http.get("/admin/notifications/users", { params });
    return response.data;
  },
  async createTemplate(payload) {
    const response = await http.post("/admin/notifications/templates", payload);
    return response.data;
  },
  async updateTemplate(id, payload) {
    const response = await http.put(`/admin/notifications/templates/${id}`, payload);
    return response.data;
  },
  async deleteTemplate(id) {
    const response = await http.delete(`/admin/notifications/templates/${id}`);
    return response.data;
  },
  async send(payload) {
    const response = await http.post("/admin/notifications/send", payload);
    return response.data;
  },
  async scheduled() {
    const response = await http.get("/admin/notifications/scheduled");
    return response.data;
  },
  async updateScheduled(id, payload) {
    const response = await http.put(`/admin/notifications/scheduled/${id}`, payload);
    return response.data;
  },
  async cancelScheduled(id) {
    const response = await http.delete(`/admin/notifications/scheduled/${id}`);
    return response.data;
  },
  async processScheduled() {
    const response = await http.post("/admin/notifications/process-scheduled");
    return response.data;
  },
  async history(params = {}) {
    const response = await http.get("/admin/notifications/history", { params });
    return response.data;
  },
};
