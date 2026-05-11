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
};
