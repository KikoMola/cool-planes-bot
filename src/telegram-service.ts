import TelegramBot from 'node-telegram-bot-api';
import { CONFIG } from './config';

export function createBot(): TelegramBot {
    return new TelegramBot(CONFIG.telegramToken, { polling: false });
}

export async function sendStartupMessage(bot: TelegramBot): Promise<void> {
    try {
        await bot.sendMessage(
            CONFIG.chatId,
            `🛩️ *Plane Bot iniciado!*\n\n` +
                `📍 Ubicación: ${CONFIG.latitude}, ${CONFIG.longitude}\n` +
                `📏 Radio: ${CONFIG.radiusNm} nm (~${Math.round(CONFIG.radiusNm * 1.852)} km)\n` +
                `⏱️ Intervalo: ${CONFIG.checkIntervalMinutes} minutos\n` +
                `🕒 Cooldown: ${CONFIG.cooldownMinutes} minutos\n\n` +
                `Estoy vigilando el cielo... 👀`,
            { parse_mode: 'Markdown' }
        );
        console.log('🤖 Mensaje de inicio enviado a Telegram.');
    } catch (error) {
        console.error('❌ No se pudo enviar mensaje de inicio. Verifica TELEGRAM_CHAT_ID.');
        console.error(error);
        process.exit(1);
    }
}

export async function sendNotification(bot: TelegramBot, message: string): Promise<void> {
    await bot.sendMessage(CONFIG.chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
    });
}

export async function sendPhoto(bot: TelegramBot, imageUrl: string): Promise<void> {
    await bot.sendPhoto(CONFIG.chatId, imageUrl);
}
