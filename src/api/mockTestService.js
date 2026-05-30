import { http } from "./http";

export const mockTestService = {
  async list(params = {}) {
    const response = await http.get("/admin/mock-tests", { params });
    return response.data;
  },
  async getById(id) {
    const response = await http.get(`/admin/mock-tests/${id}`);
    return response.data;
  },
  async create(payload) {
    const response = await http.post("/admin/mock-tests", payload);
    return response.data;
  },
  async update(id, payload) {
    const response = await http.put(`/admin/mock-tests/${id}`, payload);
    return response.data;
  },
  async remove(id) {
    const response = await http.delete(`/admin/mock-tests/${id}`);
    return response.data;
  },
  async listQuestions(params = {}) {
    const response = await http.get("/admin/mock-tests/questions", { params });
    return response.data;
  },
  async verifyEditPassword(adminPassword) {
    const response = await http.post("/admin/mock-tests/verify-edit-password", { adminPassword });
    return response.data;
  },
  async download(id) {
    const response = await http.get(`/admin/mock-tests/${id}/download`, { responseType: "blob" });
    return response.data;
  },
  async autoGenerate(payload) {
    const response = await http.post("/admin/mock-tests/auto-generate", payload);
    return response.data;
  },
  async regenerate(id, payload = {}) {
    const response = await http.post(`/admin/mock-tests/${id}/regenerate`, payload);
    return response.data;
  },
  async generationHistory(id) {
    const response = await http.get(`/admin/mock-tests/${id}/generation-history`);
    return response.data;
  },
  async getMarkingSettings() {
    const response = await http.get("/admin/mock-tests/marking-settings");
    return response.data;
  },
  async saveMarkingSettings(payload) {
    const response = await http.post("/admin/mock-tests/marking-settings", payload);
    return response.data;
  },
  async listPatternBlueprints() {
    const response = await http.get("/admin/mock-tests/pattern-blueprints");
    return response.data;
  },
  async updatePatternBlueprint(key, payload) {
    const response = await http.put(`/admin/mock-tests/pattern-blueprints/${key}`, payload);
    return response.data;
  },
};
