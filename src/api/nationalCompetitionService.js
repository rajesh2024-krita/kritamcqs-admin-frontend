import { http } from "./http";

const base = "/admin/national-competitions";

export const nationalCompetitionService = {
  dashboard: async () => (await http.get(`${base}/dashboard`)).data,
  list: async (params = {}) => (await http.get(base, { params })).data,
  get: async (id) => (await http.get(`${base}/${id}`)).data,
  create: async (payload) => (await http.post(base, payload)).data,
  update: async (id, payload) => (await http.put(`${base}/${id}`, payload)).data,
  setStatus: async (id, status) => (await http.patch(`${base}/${id}/status`, { status })).data,
  participants: async (id, params = {}) => (await http.get(`${base}/${id}/participants`, { params })).data,
  updateParticipant: async (registrationId, payload) => (await http.patch(`${base}/participants/${registrationId}`, payload)).data,
  leaderboard: async (id, params = {}) => (await http.get(`${base}/${id}/leaderboard`, { params })).data,
  refreshLeaderboard: async (id) => (await http.post(`${base}/${id}/leaderboard/refresh`)).data,
  reports: async (id) => (await http.get(`${base}/${id}/reports`)).data,
  rewards: async (id) => (await http.get(`${base}/${id}/rewards`)).data,
  createReward: async (id, payload) => (await http.post(`${base}/${id}/rewards`, payload)).data,
  updateReward: async (rewardId, payload) => (await http.patch(`${base}/rewards/${rewardId}`, payload)).data,
  notifications: async (id) => (await http.get(`${base}/${id}/notifications`)).data,
  createNotification: async (id, payload) => (await http.post(`${base}/${id}/notifications`, payload)).data,
  auditLogs: async (params = {}) => (await http.get("/admin/national-competitions-audit-logs", { params })).data,
  exportUrl: (id, format = "excel") => `${http.defaults.baseURL}${base}/${id}/export/${format}`,
};
