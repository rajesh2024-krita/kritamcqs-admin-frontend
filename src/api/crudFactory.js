import { http } from "./http";

export function createCrudService(resource) {
  return {
    async list(params = {}) {
      const response = await http.get(`/admin/${resource}`, {
        params: {
          page: 1,
          limit: 10,
          ...params,
        },
      });
      return response.data;
    },
    async getById(id, params = {}) {
      const response = await http.get(`/admin/${resource}/${id}`, { params });
      return response.data;
    },
    async create(payload) {
      const response = await http.post(`/admin/${resource}`, payload);
      return response.data;
    },
    async update(id, payload) {
      const response = await http.put(`/admin/${resource}/${id}`, payload);
      return response.data;
    },
    async remove(id, params = {}) {
      const response = await http.delete(`/admin/${resource}/${id}`, { params });
      return response.data;
    },
    async removeMany(ids, extra = {}) {
      const response = await http.post(`/admin/${resource}/bulk-delete`, { ids, ...extra });
      return response.data;
    },
    async reorder(items) {
      const response = await http.post(`/admin/${resource}/reorder`, { items });
      return response.data;
    },
  };
}
