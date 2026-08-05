import { http } from "./http";

export const ctaConfigService = {
  async list(params = {}) {
    const response = await http.get("/admin/cta-configs", { params });
    return response.data;
  },
  async create(data) {
    const response = await http.post("/admin/cta-configs", data);
    return response.data;
  },
  async update(id, data) {
    const response = await http.put(`/admin/cta-configs/${id}`, data);
    return response.data;
  },
  async delete(id) {
    const response = await http.delete(`/admin/cta-configs/${id}`);
    return response.data;
  },
};
