import { http } from "./http";
export const followUpService = {
  users: async (params = {}) => (await http.get("/admin/user-management", { params })).data,
  list: async (params = {}) => (await http.get("/admin/follow-ups", { params })).data,
  get: async (id) => (await http.get(`/admin/follow-ups/${id}`)).data,
  assign: async (userId, employeeId) => (await http.post("/admin/follow-ups/assign", { userId, employeeId })).data,
  addConversation: async (id, payload) => (await http.post(`/admin/follow-ups/${id}/conversations`, payload)).data,
  updateStatus: async (id, status) => (await http.patch(`/admin/follow-ups/${id}/status`, { status })).data,
  employeeSummary: async () => (await http.get("/admin/employees-follow-up-summary")).data,
  employees: async () => (await http.get("/admin/follow-up-employees")).data,
};
