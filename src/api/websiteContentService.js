import { http } from "./http";

export const websiteContentService = {
  async getLanding() {
    const response = await http.get("/admin/website-content/landing");
    return response.data;
  },
  async updateLanding(payload) {
    const response = await http.put("/admin/website-content/landing", payload);
    return response.data;
  },
};
