// src/features/auth/api/authApi.ts
import { apiClient } from '../../../shared/api/client'

// 🔹 회원가입 요청 타입
export type SignupRequest = {
    email: string
    password: string
    nickname: string
}

// 🔹 로그인 요청 타입
export type LoginRequest = {
    email: string
    password: string
}

// 🔹 응답 타입 (일단 기본 형태로)
export type AuthResponse = {
    accessToken: string
    refreshToken?: string
    user?: {
        id: number
        email: string
        nickname: string
    }
}

// 1. 회원가입 API
export const signupAPI = async (
    userData: SignupRequest
): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/users', userData)
    return response.data
}

// 2. 로그인 API
export const loginAPI = async (
    credentials: LoginRequest
): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/auth/login', credentials)
    return response.data
}