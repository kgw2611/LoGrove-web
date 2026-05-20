import { clearAuthStorage, getValidToken } from '../utils/auth'

export const isLoggedIn = (): boolean =>
    !!getValidToken()

export const getAccessToken = (): string | null =>
    getValidToken()

export const saveTokens = (token: string, userId: number, nickname: string): void => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('userId', String(userId))
    localStorage.setItem('nickname', nickname)
}

export const clearTokens = (): void => {
    clearAuthStorage()
}
