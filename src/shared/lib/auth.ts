export const isLoggedIn = (): boolean =>
    !!localStorage.getItem('access_token')

export const getAccessToken = (): string | null =>
    localStorage.getItem('access_token')

export const saveTokens = (token: string, userId: number, nickname: string): void => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('userId', String(userId))
    localStorage.setItem('nickname', nickname)
}

export const clearTokens = (): void => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('userId')
    localStorage.removeItem('nickname')
}
