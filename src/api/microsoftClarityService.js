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
};
