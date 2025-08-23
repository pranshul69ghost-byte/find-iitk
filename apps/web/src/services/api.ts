import axios from "axios";
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});