const COOL_PLANE_PATTERNS = [
    /^A380$/i,
    /^A388$/i,
    /^B74[0-9]$/i,
    /^B78[0-9X]$/i,
    /^A35[0-9K]$/i,
    /^A340$/i,
    /^A346$/i,
    /^A345$/i,
    /^B77[0-9LWX]$/i,
    /^B76[0-9]$/i,
];

export function isCoolPlane(type: string | undefined): boolean {
    if (!type) return false;
    return COOL_PLANE_PATTERNS.some((pattern) => pattern.test(type));
}
