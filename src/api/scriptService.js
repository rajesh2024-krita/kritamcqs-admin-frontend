import { http } from "./http";

export const scriptService = {
  async list(params = {}) {
    const response = await http.get("/admin/scripts", { params: { page: 1, limit: 10, ...params } });
    return response.data;
  },
  async getById(id) {
    const response = await http.get(`/admin/scripts/${id}`);
    return response.data;
  },
  async create(payload) {
    const response = await http.post("/admin/scripts", payload);
    return response.data;
  },
  async update(id, payload) {
    const response = await http.put(`/admin/scripts/${id}`, payload);
    return response.data;
  },
  async remove(id) {
    const response = await http.delete(`/admin/scripts/${id}`);
    return response.data;
  },
  async setStatus(id, status) {
    const response = await http.patch("/admin/scripts/status", { id, status });
    return response.data;
  },
  async duplicate(id) {
    const response = await http.post(`/admin/scripts/${id}/duplicate`);
    return response.data;
  },
};
