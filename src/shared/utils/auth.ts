const AUTH_STORAGE_KEYS = [
    'access_token',
    'userId',
    'nickname',
    'user_db',
];

function decodeJwtPayload(token: string): Record<string, unknown> {
    const [, payload] = token.split('.');
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');

    return JSON.parse(atob(padded));
}

export function isTokenExpired(token: string): boolean {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return true;

        const payload = decodeJwtPayload(token);
        if (typeof payload.exp !== 'number') return false;

        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

export function clearAuthStorage(): void {
    AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function getValidToken(): string | null {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    if (isTokenExpired(token)) {
        clearAuthStorage();
        return null;
    }

    return token;
}
