import axios from 'axios';

import useAuthStore from '../store/authStore';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add JWT token to every request
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor to handle authentication errors (e.g., token expiry)
api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response && error.response.status === 401) {
        // Only trigger if the user is currently considered authenticated
        // (avoids double-redirect race with manual logout)
        if (useAuthStore.getState().isAuthenticated) {
            useAuthStore.getState().logout();
            window.location.href = '/';
        }
    }
    return Promise.reject(error);
});

export default api;
