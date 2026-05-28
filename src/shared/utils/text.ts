export function truncateWithPeriods(value: string, maxLength: number) {
    const chars = Array.from(value);
    if (chars.length <= maxLength) return value;

    return `${chars.slice(0, maxLength).join('').trimEnd()}...`;
}
