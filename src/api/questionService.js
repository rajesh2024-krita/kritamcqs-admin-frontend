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
  async validateBulkUpload(file, uploadMode = "upload", createMissingQuestions = false) {
    const formData = new FormData();
    formData.append("sheet", file);
    formData.append("uploadMode", uploadMode);
    formData.append("createMissingQuestions", String(createMissingQuestions));
    const response = await http.post("/admin/questions/bulk-upload/validate", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  async createBulkUploadCategories(batchId) {
    const response = await http.post(`/admin/questions/bulk-upload/${batchId}/create-categories`);
    return response.data;
  },
  async updateNewColumnValues(batchId) {
    const response = await http.post(`/admin/questions/bulk-upload/${batchId}/update-new-columns`);
    return response.data;
  },
  async getBulkUploadStatus(batchId) {
    const response = await http.get(`/admin/questions/bulk-upload/${batchId}/status`);
    return response.data;
  },
  async approveBulkUpload(batchId, uploadAnyway = false, updateExisting = false) {
    const response = await http.post(`/admin/questions/bulk-upload/${batchId}/approve`, { uploadAnyway, updateExisting });
    return response.data;
  },
  async exportRecords(params = {}) {
    const response = await http.get("/admin/questions/export", {
      params,
      responseType: "blob",
    });
    return response;
  },
  async history(questionId) {
    const response = await http.get("/admin/question-activity-logs", {
      params: { questionId, limit: 100 },
    });
    return response.data;
  },
  async aiScan(questionId, questionData = null) {
    const response = await http.post(`/admin/questions/katex-audit/ai-scan/${questionId}`, { questionData });
    return response.data;
  },
};
