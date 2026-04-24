import { validateConfig } from './config';
import { fetchAircraft, getFlightRoute } from './aircraft-service';
import { isCoolPlane } from './filters';
import { isInCooldown, markNotified } from './deduplication';
import { buildMessage } from './message-builder';
import { createBot, sendStartupMessage, sendNotification, sendPhoto } from './telegram-service';
import { getAircraftImage } from './image-service';
import { Aircraft } from './types';

async function processAndNotify(planes: Aircraft[]): Promise<void> {
    const bot = createBot();
    const coolPlanes = planes.filter((p) => isCoolPlane(p.t));

    if (coolPlanes.length === 0) {
        console.log('😴 Ningún avión molón en la zona.');
        return;
    }

    console.log(`✨ ${coolPlanes.length} avión(es) molón(es) encontrado(s):`);
    for (const p of coolPlanes) {
        console.log(`   - ${p.flight?.trim() || 'N/A'} | ${p.t} | ${p.dst?.toFixed(1)}nm`);
    }

    for (const plane of coolPlanes) {
        if (isInCooldown(plane.hex)) {
            console.log(`⏳ ${plane.flight?.trim() || plane.hex} en cooldown, omitiendo.`);
            continue;
        }

        const route = await getFlightRoute(plane.hex, plane.flight);
        const message = buildMessage(plane, route);
        const image = await getAircraftImage(plane.hex);

        if (image) {
            try {
                const photoCaption = `📸 Foto por ${image.photographer}`;
                await sendPhoto(bot, image.buffer, photoCaption);
                console.log(`📸 Foto enviada: ${plane.flight?.trim() || plane.hex}`);
            } catch (error) {
                console.error(`❌ Error enviando foto a Telegram:`, error);
            }
        }

        try {
            await sendNotification(bot, message);
            markNotified(plane.hex);
            console.log(`✅ Notificación enviada: ${plane.flight?.trim() || plane.hex}`);
        } catch (error) {
            console.error(`❌ Error enviando mensaje a Telegram:`, error);
        }
    }
}

async function runCheck(): Promise<void> {
    const planes = await fetchAircraft();
    await processAndNotify(planes);
}

async function main(): Promise<void> {
    validateConfig();

    const bot = createBot();
    await sendStartupMessage(bot);

    console.log(`\n🚀 Plane Bot arrancado`);
    console.log(`   ⏱️ Intervalo: ${process.env.CHECK_INTERVAL_MINUTES || '5'} min`);
    console.log(`   🕒 Cooldown: ${process.env.COOLDOWN_MINUTES || '30'} min`);
    console.log(`   ✈️ Tipos: A380, B747, B787, A350, A340, B777, B767\n`);

    // Primera ejecución inmediata
    await runCheck();

    // Loop periódico
    const intervalMs = parseInt(process.env.CHECK_INTERVAL_MINUTES || '5', 10) * 60 * 1000;
    setInterval(runCheck, intervalMs);
}

main().catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
});
