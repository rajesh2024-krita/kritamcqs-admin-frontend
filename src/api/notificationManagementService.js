import { http } from "./http";

export const notificationManagementService = {
  async get() {
    const response = await http.get("/admin/notification-management");
    return response.data;
  },
  async update(payload) {
    const response = await http.put("/admin/notification-management", payload);
    return response.data;
  },
  async runReminders(payload = {}) {
    const response = await http.post("/admin/notification-management/run-reminders", payload);
    return response.data;
  },
  async testUser(payload) {
    const response = await http.post("/admin/notification-management/test-user", payload);
    return response.data;
  },
};
