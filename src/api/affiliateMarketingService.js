import { http } from "./http";
export const affiliateMarketingService = {
  dashboard: () => http.get("/admin/affiliate-marketing/dashboard"), affiliates: () => http.get("/admin/affiliate-marketing/affiliates"),
  create: (data) => http.post("/admin/affiliate-marketing/affiliates", data), update: (id, data) => http.patch(`/admin/affiliate-marketing/affiliates/${id}`, data),
  referrals: () => http.get("/admin/affiliate-marketing/referrals"), purchases: () => http.get("/admin/affiliate-marketing/purchases"),
  settings: () => http.get("/admin/affiliate-marketing/settings"), updateSettings: (data) => http.patch("/admin/affiliate-marketing/settings", data),
};
