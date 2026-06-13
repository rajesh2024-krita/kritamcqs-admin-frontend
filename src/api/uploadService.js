import { http } from "./http";

export const uploadService = {
  async appImage(file, folder = "app-assets") {
    const formData = new FormData();
    formData.set("image", file);
    formData.set("folder", folder);
    const response = await http.post("/admin/uploads/app-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  async appImages(files, folder = "app-assets") {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    formData.set("folder", folder);
    const response = await http.post("/admin/uploads/app-images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};
