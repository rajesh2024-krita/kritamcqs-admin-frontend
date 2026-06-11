import { http } from "./http";

export const contactService = {
  async list(params = {}) {
    const response = await http.get("/admin/contact-messages", { params });
    return response.data;
  },
  async unreadCount() {
    const response = await http.get("/admin/contact-messages/unread-count");
    return response.data;
  },
  async markRead(id) {
    const response = await http.patch(`/admin/contact-messages/${id}/read`);
    return response.data;
  },
  async markUnread(id) {
    const response = await http.patch(`/admin/contact-messages/${id}/unread`);
    return response.data;
  },
  async reply(id, payload) {
    const response = await http.post(`/admin/contact-messages/${id}/reply`, payload);
    return response.data;
  },
};
