import { http } from "./http";
export const affiliateMarketingService = {
  dashboard: (params) => http.get("/admin/affiliate-marketing/dashboard", { params }), affiliates: () => http.get("/admin/affiliate-marketing/affiliates"),
  create: (data) => http.post("/admin/affiliate-marketing/affiliates", data), update: (id, data) => http.patch(`/admin/affiliate-marketing/affiliates/${id}`, data),
  referrals: (params) => http.get("/admin/affiliate-marketing/referrals", { params }), purchases: (params) => http.get("/admin/affiliate-marketing/purchases", { params }),
  settings: () => http.get("/admin/affiliate-marketing/settings"), updateSettings: (data) => http.patch("/admin/affiliate-marketing/settings", data),
};
