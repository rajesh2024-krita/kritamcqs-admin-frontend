import { http } from "./http";

export const aiConfigService = {
  async list() {
    const response = await http.get("/admin/ai/configurations");
    return response.data;
  },
  async save(payload) {
    const response = await http.post("/admin/ai/configurations", payload);
    return response.data;
  },
  async fetchModels(provider) {
    const response = await http.post(`/admin/ai/configurations/${provider}/models`);
    return response.data;
  },
  async test(provider) {
    const response = await http.post(`/admin/ai/configurations/${provider}/test`);
    return response.data;
  },
};
