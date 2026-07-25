import { http } from "./http";

export const microsoftClarityService = {
  async get() {
    const response = await http.get("/settings/microsoft-clarity");
    return response.data;
  },
  async save(payload) {
    const response = await http.put("/settings/microsoft-clarity", payload);
    return response.data;
  },
  async status() {
    const response = await http.get("/admin/microsoft-clarity/status");
    return response.data;
  },
  async logs(params = {}) {
    const response = await http.get("/admin/microsoft-clarity/logs", { params });
    return response.data;
  },
  async clearLogs() {
    const response = await http.delete("/admin/microsoft-clarity/logs");
    return response.data;
  },
  async exportLogs(format = "csv") {
    const response = await http.get("/admin/microsoft-clarity/logs/export", {
      params: { format },
      responseType: "blob",
    });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `microsoft-clarity-logs.${format === "xlsx" ? "xlsx" : "csv"}`;
    anchor.click();
    URL.revokeObjectURL(url);
  },
};
