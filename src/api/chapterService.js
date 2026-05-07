import { createCrudService } from "./crudFactory";
import { http } from "./http";

export const chapterService = {
  ...createCrudService("chapters"),
  async bulkFreeAccessUpdate(payload) {
    const response = await http.post("/admin/chapters/free-access/bulk", payload);
    return response.data;
  },
};
