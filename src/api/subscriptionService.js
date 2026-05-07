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
};
