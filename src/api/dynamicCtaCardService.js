import { http } from "./http";

export const dynamicCtaCardService = {
  async getAll() {
    const response = await http.get("/admin/dynamic-cta-cards");
    return response.data;
  },
  async update(screen, payload) {
    const response = await http.put(`/admin/dynamic-cta-cards/${screen}`, payload);
    return response.data;
  },
};
