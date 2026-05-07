import { http } from "./http";

export const authService = {
  async status() {
    const response = await http.get("/admin-auth/status");
    return response.data;
  },
  async login(payload) {
    const response = await http.post("/admin-auth/login", payload);
    return response.data;
  },
  async bootstrap(payload) {
    const response = await http.post("/admin-auth/bootstrap", payload);
    return response.data;
  },
  async register(payload) {
    const response = await http.post("/admin-auth/register", payload);
    return response.data;
  },
  async me() {
    const response = await http.get("/admin-auth/me");
    return response.data;
  },
};
