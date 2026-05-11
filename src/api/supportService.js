import { http } from "./http";

export const supportService = {
  async list(params = {}) {
    const response = await http.get("/admin/support-tickets", { params });
    return response.data;
  },
  async markRead(id) {
    const response = await http.patch(`/admin/support-tickets/${id}/read`);
    return response.data;
  },
  async reply(id, payload) {
    const response = await http.post(`/admin/support-tickets/${id}/reply`, payload);
    return response.data;
  },
};
