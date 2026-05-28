import { http } from "./http";

export const freeQuestionService = {
  async list() {
    const response = await http.get("/admin/free-question-configs");
    return response.data;
  },
  async save(payload) {
    const response = await http.post("/admin/free-question-configs", payload);
    return response.data;
  },
  async remove(id) {
    const response = await http.delete(`/admin/free-question-configs/${id}`);
    return response.data;
  },
};
