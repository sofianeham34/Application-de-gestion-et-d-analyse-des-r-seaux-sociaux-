import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_PROXY_GATEWAY || '',
});

// Ajoute le JWT de l'utilisateur connecté à chaque requête vers l'API.
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Session expirée ou invalide : retour à la page de connexion.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.includes('/api/users/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user_id');
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);
