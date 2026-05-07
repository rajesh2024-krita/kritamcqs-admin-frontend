import { http } from "./http";

export const dailyPlanService = {
  async list(params = {}) {
    const response = await http.get("/admin/daily-plan-configs", { params });
    return response.data;
  },
  async getById(id) {
    const response = await http.get(`/admin/daily-plan-configs/${id}`);
    return response.data;
  },
  async create(payload) {
    const response = await http.post("/admin/daily-plan-configs", payload);
    return response.data;
  },
  async update(id, payload) {
    const response = await http.put(`/admin/daily-plan-configs/${id}`, payload);
    return response.data;
  },
  async remove(id) {
    const response = await http.delete(`/admin/daily-plan-configs/${id}`);
    return response.data;
  },
  async listQuestions(params = {}) {
    const response = await http.get("/admin/daily-plan-configs/questions", { params });
    return response.data;
  },
};
