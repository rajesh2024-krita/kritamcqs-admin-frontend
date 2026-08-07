import { http } from "./http";

const subscriptionCancellationReminderPath = "/admin/notification-management/subscription-cancellation-reminders";

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
  async paymentCancelledAuto() {
    const response = await http.get(subscriptionCancellationReminderPath);
    return response.data;
  },
  async createPaymentCancelledAuto(payload) {
    const response = await http.post(subscriptionCancellationReminderPath, payload);
    return response.data;
  },
  async updatePaymentCancelledAuto(id, payload) {
    const response = await http.put(`${subscriptionCancellationReminderPath}/${id}`, payload);
    return response.data;
  },
  async setPaymentCancelledAutoStatus(id, status) {
    const response = await http.patch(`${subscriptionCancellationReminderPath}/${id}/status`, { status });
    return response.data;
  },
  async deletePaymentCancelledAuto(id) {
    const response = await http.delete(`${subscriptionCancellationReminderPath}/${id}`);
    return response.data;
  },
  async testPaymentCancelledAuto(payload) {
    const response = await http.post(`${subscriptionCancellationReminderPath}/test`, payload);
    return response.data;
  },
  async deletePaymentCancelledAutoLogs(payload) {
    const response = await http.delete(`${subscriptionCancellationReminderPath}/logs`, { data: payload });
    return response.data;
  },
};
