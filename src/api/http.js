import axios from "axios";

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://adminapi.kritamcqs.com/api" : "http://localhost:3001/api"),
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("krita_admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }

    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error.message ||
      "Something went wrong";

    return Promise.reject(new Error(message));
  },
);
