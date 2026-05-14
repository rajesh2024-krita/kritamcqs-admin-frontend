import { http } from "./http";

export const emailTemplateService = {
  async list(params = {}) {
    const response = await http.get("/admin/email-templates", { params });
    return response.data;
  },
  async catalog() {
    const response = await http.get("/admin/email-templates/catalog");
    return response.data;
  },
  async get(id) {
    const response = await http.get(`/admin/email-templates/${id}`);
    return response.data;
  },
  async create(data) {
    const response = await http.post("/admin/email-templates", data);
    return response.data;
  },
  async update(id, data) {
    const response = await http.put(`/admin/email-templates/${id}`, data);
    return response.data;
  },
  async delete(id) {
    const response = await http.delete(`/admin/email-templates/${id}`);
    return response.data;
  },
  async test(id, data) {
    const response = await http.post(`/admin/email-templates/${id}/test`, data);
    return response.data;
  },
  async preview(id, data) {
    const response = await http.post(`/admin/email-templates/${id}/preview`, data);
    return response.data;
  },
  async bulkUpload(file, updateExisting = false) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("updateExisting", String(updateExisting));
    const response = await http.post("/admin/email-templates/bulk-upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  async syncDefaults() {
    const response = await http.post("/admin/email-templates/sync-defaults");
    return response.data;
  },
  async audit() {
    const response = await http.get("/admin/email-templates/audit");
    return response.data;
  },
  async logs(params = {}) {
    const response = await http.get("/admin/email-logs", { params });
    return response.data;
  },
  async retryLog(id, data = {}) {
    const response = await http.post(`/admin/email-logs/${id}/retry`, data);
    return response.data;
  },
};
