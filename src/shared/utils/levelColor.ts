const LEVEL_COLORS: Record<number, string> = {
    1: '#9E9E9E',
    2: '#4CAF50',
    3: '#2196F3',
    4: '#9C27B0',
    5: '#FF9800',
    6: '#F44336',
    7: '#FFD700',
};

const LEVEL_NAMES: Record<number, string> = {
    1: '입문',
    2: '성장',
    3: '숙련',
    4: '고급',
    5: '전문가',
    6: '마스터',
    7: '레전드',
};

export function normalizeLevel(level?: number | null): number {
    if (typeof level !== 'number' || !Number.isFinite(level) || level < 1) return 1;
    if (level > 7) return 7;
    return Math.floor(level);
}

export function getLevelColor(level?: number | null): string {
    return LEVEL_COLORS[normalizeLevel(level)];
}

export function getLevelName(level?: number | null): string {
    return LEVEL_NAMES[normalizeLevel(level)];
}
