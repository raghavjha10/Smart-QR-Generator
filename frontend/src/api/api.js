import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: API_URL });

// QR Codes
export const fetchQRCodes = (params) => api.get("/qrcodes", { params });
export const fetchQRById = (id) => api.get(`/qrcodes/${id}`);
export const createQRCode = (data) => api.post("/qrcodes", data);
export const regenerateQRCode = (id, data) => api.put(`/qrcodes/${id}/regenerate`, data);
export const deleteQRCode = (id) => api.delete(`/qrcodes/${id}`);
export const trackManualScan = (id) => api.post(`/qrcodes/${id}/track`);

// Downloads (return full URL so <a href> can be used directly)
export const getPngDownloadUrl = (id) => `${API_URL}/qrcodes/${id}/download/png`;
export const getSvgDownloadUrl = (id) => `${API_URL}/qrcodes/${id}/download/svg`;
export const getScanUrl = (id) => `${API_URL}/scan/${id}`;

// Analytics
export const fetchAnalytics = (params) => api.get("/analytics", { params });

export default api;
