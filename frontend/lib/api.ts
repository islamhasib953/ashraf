import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({ baseURL: API_URL });

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally → redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Auth ─────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; username: string; password: string; full_name?: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

// ─── Agents ───────────────────────────────────────────────────────
export const agentsApi = {
  list: () => api.get("/agents"),
  create: (data: any) => api.post("/agents", data),
  get: (id: number) => api.get(`/agents/${id}`),
  update: (id: number, data: any) => api.put(`/agents/${id}`, data),
  delete: (id: number) => api.delete(`/agents/${id}`),
};

// ─── Workflows ────────────────────────────────────────────────────
export const workflowsApi = {
  list: () => api.get("/workflows"),
  create: (data: any) => api.post("/workflows", data),
  get: (id: number) => api.get(`/workflows/${id}`),
  update: (id: number, data: any) => api.put(`/workflows/${id}`, data),
  delete: (id: number) => api.delete(`/workflows/${id}`),
  run: (id: number, input?: any) => api.post(`/workflows/${id}/run`, { input_data: input || {} }),
  getRuns: (id: number) => api.get(`/workflows/${id}/runs`),
};

// ─── Connections ──────────────────────────────────────────────────
export const connectionsApi = {
  list: () => api.get("/connections"),
  create: (data: any) => api.post("/connections", data),
  delete: (id: number) => api.delete(`/connections/${id}`),
  test: (data: any) => api.post("/connections/test", data),
};

// ─── Runs ─────────────────────────────────────────────────────────
export const runsApi = {
  list: (status?: string) => api.get("/runs", { params: { status } }),
  get: (id: number) => api.get(`/runs/${id}`),
};

// ─── Node Types ───────────────────────────────────────────────────
export const getNodeTypes = () => api.get("/nodes/types");
