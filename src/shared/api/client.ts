// src/shared/api/client.ts
import axios, { type InternalAxiosRequestConfig } from 'axios'; // 🔥 type 키워드 추가!

// 공통 API 클라이언트 인스턴스 생성
export const apiClient = axios.create({
    baseURL: 'http://localhost:8080', // 🔥 나중에 실제 백엔드 서버 주소로 변경하세요!
    headers: {
        'Content-Type': 'application/json',
    },
});

// (보너스) 나중에 로그인 토큰이 생기면 알아서 헤더에 넣어주는 인터셉터
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');

    // config.headers가 존재하는지 안전하게 체크한 후 토큰을 넣습니다.
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});