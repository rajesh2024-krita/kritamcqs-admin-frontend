import { http } from "./http";

export const insightsService = {
  async getWeakAreas() {
    const response = await http.get("/admin/weak-areas/analytics");
    return response.data;
  },

  async createWeakAreaCategory(payload) {
    const response = await http.post("/admin/weak-areas/categories", payload);
    return response.data;
  },

  async updateWeakAreaCategory(id, payload) {
    const response = await http.put(`/admin/weak-areas/categories/${id}`, payload);
    return response.data;
  },

  async deleteWeakAreaCategory(id) {
    const response = await http.delete(`/admin/weak-areas/categories/${id}`);
    return response.data;
  },

  async getMistakes() {
    const response = await http.get("/admin/mistakes/analytics");
    return response.data;
  },
};
