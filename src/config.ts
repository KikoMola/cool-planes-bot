import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const CONFIG = {
    telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
    latitude: parseFloat(process.env.LATITUDE || '39.48837067281416'),
    longitude: parseFloat(process.env.LONGITUDE || '-0.4808438442805943'),
    radiusNm: parseInt(process.env.RADIUS_NM || '27', 10),
    checkIntervalMinutes: parseInt(process.env.CHECK_INTERVAL_MINUTES || '5', 10),
    cooldownMinutes: parseInt(process.env.COOLDOWN_MINUTES || '30', 10),
} as const;

export function validateConfig(): void {
    const missing: string[] = [];
    if (!CONFIG.telegramToken) missing.push('TELEGRAM_BOT_TOKEN');
    if (!CONFIG.chatId) missing.push('TELEGRAM_CHAT_ID');

    if (missing.length > 0) {
        console.error(`❌ Faltan variables en .env: ${missing.join(', ')}`);
        console.error('   Copia .env.example a .env y rellena los valores.');
        process.exit(1);
    }
}
