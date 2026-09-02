import { http } from "./http";
export const affiliateMarketingService = {
  dashboard: (params) => http.get("/affiliate/admin/dashboard", { params }), affiliates: () => http.get("/affiliate/admin/affiliates"),
  create: (data) => http.post("/affiliate/admin/affiliates", data), update: (id, data) => http.patch(`/affiliate/admin/affiliates/${id}`, data),
  referrals: (params) => http.get("/affiliate/admin/referrals", { params }), purchases: (params) => http.get("/affiliate/admin/purchases", { params }),
  settings: () => http.get("/affiliate/admin/settings"), updateSettings: (data) => http.patch("/affiliate/admin/settings", data),
};
