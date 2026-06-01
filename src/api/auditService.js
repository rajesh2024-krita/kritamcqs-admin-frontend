import { http } from "./http";

export const auditService = {
  async questionActivity(params = {}) {
    const response = await http.get("/admin/question-activity-logs", { params: { page: 1, limit: 20, ...params } });
    return response.data;
  },
  async loginHistory(params = {}) {
    const response = await http.get("/admin/login-history", { params: { page: 1, limit: 20, ...params } });
    return response.data;
  },
};
