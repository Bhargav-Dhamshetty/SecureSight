import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Types
export interface Camera {
  id: number;
  name: string;
  location: string;
  incidents?: Incident[];
  createdAt: string;
}

export interface Incident {
  id: number;
  cameraId: number;
  camera: Camera;
  type: string;
  tsStart: string;
  tsEnd: string | null;
  thumbnailUrl: string;
  resolved: boolean;
  createdAt: string;
}

// User API functions
export const userAPI = {
  getUsers: () => api.get('/api/users'),
  createUser: (data: { name: string; email: string }) => api.post('/api/users', data),
};

// Camera and Incident API functions
export const cameraAPI = {
  getCameras: () => api.get<Camera[]>('/api/cameras'),
};

export const incidentAPI = {
  getIncidents: (resolved?: boolean) => 
    api.get<Incident[]>('/api/incidents', { 
      params: resolved !== undefined ? { resolved } : {} 
    }),
  resolveIncident: (id: number) => 
    api.patch<Incident>(`/api/incidents/${id}/resolve`),
};