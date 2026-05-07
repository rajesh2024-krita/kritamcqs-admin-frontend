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
  async getOverview(id) {
    const response = await service.getById(`${id}/overview`);
    return response;
  },
};
