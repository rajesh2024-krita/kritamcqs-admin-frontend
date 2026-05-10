import { http } from "./http";

export const subscriptionService = {
  async list(params = {}) {
    const response = await http.get("/admin/subscriptions", { params });
    return response.data;
  },
  async listPlans() {
    const response = await http.get("/admin/subscription-plans");
    return response.data;
  },
  async createManual(payload) {
    const response = await http.post("/admin/subscriptions/manual", payload);
    return response.data;
  },
  async previewCoupon(payload) {
    const response = await http.post("/admin/subscriptions/coupon-preview", payload);
    return response.data;
  },
  async cancel(id, payload = {}) {
    const response = await http.post(`/admin/subscriptions/${id}/cancel`, payload);
    return response.data;
  },
  async getPaymentGatewaySettings() {
    const response = await http.get("/admin/payment-gateway-settings");
    return response.data;
  },
  async savePaymentGatewaySettings(payload) {
    const response = await http.post("/admin/payment-gateway-settings", payload);
    return response.data;
  },
  async getInvoiceSettings() {
    const response = await http.get("/admin/invoice-settings");
    return response.data;
  },
  async saveInvoiceSettings(payload) {
    const response = await http.post("/admin/invoice-settings", payload);
    return response.data;
  },
  async uploadInvoiceLogo(file) {
    const formData = new FormData();
    formData.append("logo", file);
    const response = await http.post("/admin/invoice-settings/logo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  async listInvoices(params = {}) {
    const response = await http.get("/admin/invoices", { params });
    return response.data;
  },
  async getInvoice(id) {
    const response = await http.get(`/admin/invoices/${id}`);
    return response.data;
  },
  async createInvoice(payload) {
    const response = await http.post("/admin/invoices", payload);
    return response.data;
  },
  async updateInvoice(id, payload) {
    const response = await http.put(`/admin/invoices/${id}`, payload);
    return response.data;
  },
  async duplicateInvoice(id) {
    const response = await http.post(`/admin/invoices/${id}/duplicate`);
    return response.data;
  },
  async sendInvoice(id, payload = {}) {
    const response = await http.post(`/admin/invoices/${id}/send`, payload);
    return response.data;
  },
  async deleteInvoice(id) {
    const response = await http.delete(`/admin/invoices/${id}`);
    return response.data;
  },
  async generateInvoice(subscriptionId) {
    const response = await http.post(`/admin/invoices/subscriptions/${subscriptionId}/generate`);
    return response.data;
  },
  async testInvoiceEmail(payload) {
    const response = await http.post("/admin/invoice-settings/test-email", payload);
    return response.data;
  },
  async sendTestInvoice(payload) {
    const response = await http.post("/admin/invoice-settings/test-invoice", payload);
    return response.data;
  },
  async getNotificationSettings() {
    const response = await http.get("/admin/notification-settings");
    return response.data;
  },
  async saveNotificationSettings(payload) {
    const response = await http.post("/admin/notification-settings", payload);
    return response.data;
  },
  async runExpiryReminders() {
    const response = await http.post("/admin/notification-settings/run-expiry-reminders");
    return response.data;
  },
  async listSessions(params = {}) {
    const response = await http.get("/admin/sessions", { params });
    return response.data;
  },
};
