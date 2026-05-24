import axios, { type InternalAxiosRequestConfig } from 'axios';
import { clearAuthStorage, getValidToken } from '../utils/auth';

export const apiClient = axios.create({
    baseURL: '/api',
});

const protectedPaths = ['/mypage', '/study', '/community/write', '/forum/write', '/gallery/write'];

apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getValidToken();

        if (token && config.headers && !config.headers.Authorization) {
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
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;

        if (status === 401 || status === 403) {
            clearAuthStorage();

            const currentPath = window.location.pathname;
            const isProtectedPath = protectedPaths.some((path) => currentPath.startsWith(path));

            if (isProtectedPath && !currentPath.startsWith('/login')) {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);
