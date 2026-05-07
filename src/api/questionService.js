import { createCrudService } from "./crudFactory";
import { http } from "./http";

export const questionService = {
  ...createCrudService("questions"),
  async uploadAsset(file) {
    const formData = new FormData();
    formData.append("image", file);
    const response = await http.post("/admin/questions/upload-asset", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  async ownAssetUrl(url) {
    const response = await http.post("/admin/questions/own-asset-url", { url });
    return response.data;
  },
  async validateBulkUpload(file) {
    const formData = new FormData();
    formData.append("sheet", file);
    const response = await http.post("/admin/questions/bulk-upload/validate", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  async createBulkUploadCategories(batchId) {
    const response = await http.post(`/admin/questions/bulk-upload/${batchId}/create-categories`);
    return response.data;
  },
  async approveBulkUpload(batchId) {
    const response = await http.post(`/admin/questions/bulk-upload/${batchId}/approve`);
    return response.data;
  },
};
