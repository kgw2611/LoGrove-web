import axios, { type InternalAxiosRequestConfig } from 'axios';

export const apiClient = axios.create({
    baseURL: 'http://3.38.12.226:8080/api',
});

apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('userId');
            localStorage.removeItem('nickname');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);