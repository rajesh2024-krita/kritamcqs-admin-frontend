import { http } from "./http";

export const employeeService = {
  async list(params = {}) {
    const response = await http.get("/admin/employees", { params: { page: 1, limit: 20, ...params } });
    return response.data;
  },
  async create(payload) {
    const response = await http.post("/admin/employees", payload);
    return response.data;
  },
  async update(id, payload) {
    const response = await http.put(`/admin/employees/${id}`, payload);
    return response.data;
  },
  async deactivate(id) {
    const response = await http.post(`/admin/employees/${id}/deactivate`);
    return response.data;
  },
  async remove(id) {
    const response = await http.delete(`/admin/employees/${id}`);
    return response.data;
  },
};
