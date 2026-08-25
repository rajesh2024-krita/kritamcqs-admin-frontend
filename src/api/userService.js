import { createCrudService } from "./crudFactory";
import { http } from "./http";

const service = createCrudService("users");

export const userService = {
  ...service,
  async previewMigration(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await http.post("/admin/users/migration/preview", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  async importMigration(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await http.post("/admin/users/migration/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  async listMigrationLogs() {
    const response = await http.get("/admin/users/migration/logs");
    return response.data;
  },
  async downloadBulkTemplate(format = "xlsx") {
    return http.get("/admin/users/bulk/template", { params: { format }, responseType: "blob" });
  },
  async bulkImport(file, settings) {
    const formData = new FormData();
    formData.append("file", file);
    Object.entries(settings || {}).forEach(([key, value]) => formData.append(key, String(value)));
    const response = await http.post("/admin/users/bulk/import", formData, { headers: { "Content-Type": "multipart/form-data" } });
    return response.data;
  },
  async exportUsers(payload = {}) {
    const response = await http.post("/admin/users/export", payload, {
      responseType: "blob",
    });
    return response;
  },
  async getOverview(id) {
    const response = await service.getById(`${id}/overview`);
    return response;
  },
  async truncateData(id) {
    const response = await http.post(`/admin/users/${id}/truncate`);
    return response.data;
  },
};
