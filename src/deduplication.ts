import { CONFIG } from './config';

const notifiedAircraft = new Map<string, number>();

export function isInCooldown(hex: string): boolean {
    const lastNotified = notifiedAircraft.get(hex);
    if (!lastNotified) return false;

    const cooldownMs = CONFIG.cooldownMinutes * 60 * 1000;
    return Date.now() - lastNotified < cooldownMs;
}

export function markNotified(hex: string): void {
    notifiedAircraft.set(hex, Date.now());
}

function cleanupOldEntries(): void {
    const cutoff = Date.now() - CONFIG.cooldownMinutes * 60 * 1000;
    let cleaned = 0;
    for (const [hex, time] of notifiedAircraft.entries()) {
        if (time < cutoff) {
            notifiedAircraft.delete(hex);
            cleaned++;
        }
    }
    if (cleaned > 0) {
        console.log(`🧹 Limpieza: ${cleaned} aviones eliminados del cooldown`);
    }
}

// Limpiar entradas antiguas cada 2 horas para evitar memory leaks
setInterval(cleanupOldEntries, 2 * 60 * 60 * 1000);
