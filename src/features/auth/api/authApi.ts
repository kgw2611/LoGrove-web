// src/features/auth/api/authApi.ts
import { apiClient } from '../../../shared/api/client'

// 🔹 회원가입 요청 타입
export type SignupRequest = {
    loginId: string
    loginPw: string
    name: string
    nickname: string
    email: string
}

// 🔹 로그인 요청 타입
export type LoginRequest = {
    loginId: string
    loginPw: string
}

// 🔹 로그인 응답 타입
export type LoginResponse = {
    token: string
    nickname: string
    userId: number
}

// 1. 회원가입 API
export const signupAPI = async (userData: SignupRequest): Promise<void> => {
    await apiClient.post('/api/users', userData)
}

// 2. 로그인 API
export const loginAPI = async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/api/auth/login', credentials)
    return response.data.data
}