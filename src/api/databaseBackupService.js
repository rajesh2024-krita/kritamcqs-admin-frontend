import { http } from "./http";

export const databaseBackupService = {
  list: () => http.get("/admin/database-backups"),
  updateSettings: (automaticEnabled) => http.patch("/admin/database-backups/settings", { automaticEnabled }),
  create: (password) => http.post("/admin/database-backups", { password, confirmed: true }),
  download: (id, password) => http.post(`/admin/database-backups/${id}/download`, { password }, { responseType: "blob" }),
  authorizeRestore: (id, password) => http.post(`/admin/database-backups/${id}/restore-authorization`, { password, confirmed: true }),
  restore: (id, authorizationToken) => http.post(`/admin/database-backups/${id}/restore`, { authorizationToken, finalConfirmation: true }),
};
