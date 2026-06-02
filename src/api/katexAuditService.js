import { http } from "./http";

export const katexAuditService = {
  async list(params = {}) {
    const response = await http.get("/admin/questions/katex-audit", { params: { page: 1, limit: 20, ...params } });
    return response.data;
  },
  async scanAll(batchSize = 500) {
    const response = await http.post("/admin/questions/katex-audit/scan", { batchSize });
    return response.data;
  },
  async scanBySubject(subjectId, batchSize = 500) {
    const response = await http.post("/admin/questions/katex-audit/scan", { subjectId, batchSize });
    return response.data;
  },
  async scanSingle(questionId) {
    const response = await http.post(`/admin/questions/katex-audit/scan/${questionId}`);
    return response.data;
  },
  async autoFix(questionId) {
    const response = await http.post(`/admin/questions/katex-audit/${questionId}/auto-fix`);
    return response.data;
  },
  async bulkAutoFix(questionIds) {
    const response = await http.post("/admin/questions/katex-audit/bulk-auto-fix", { questionIds });
    return response.data;
  },
  async markReviewed(questionIds) {
    const response = await http.post("/admin/questions/katex-audit/mark-reviewed", { questionIds });
    return response.data;
  },
  async export(format = "csv", params = {}) {
    const response = await http.get(`/admin/questions/katex-audit/export/${format}`, {
      params,
      responseType: "blob",
    });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = format === "xlsx" ? "katex-audit.xlsx" : "katex-audit.csv";
    link.click();
    URL.revokeObjectURL(url);
  },
};
