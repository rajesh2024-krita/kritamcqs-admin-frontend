import { http } from "./http";

export const offerTimerService = {
  async get() {
    const response = await http.get("/admin/offer-timer");
    return response.data;
  },
  async update(payload) {
    const response = await http.put("/admin/offer-timer", payload);
    return response.data;
  },
};
