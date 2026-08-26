import { http } from "./http";

export const coordinatorService = {
  list: (params = {}) => http.get("/admin/coordinators", { params }).then(r => r.data),
  get: (id) => http.get(`/admin/coordinators/${id}`).then(r => r.data),
  summary: () => http.get("/admin/coordinators/summary").then(r => r.data),
  employees: () => http.get("/admin/coordinator-employees").then(r => r.data),
  create: (data) => http.post("/admin/coordinators", data).then(r => r.data),
  update: (id, data) => http.put(`/admin/coordinators/${id}`, data).then(r => r.data),
  remove: (id) => http.delete(`/admin/coordinators/${id}`).then(r => r.data),
  addFollowUp: (id, data) => http.post(`/admin/coordinators/${id}/follow-ups`, data).then(r => r.data),
};
