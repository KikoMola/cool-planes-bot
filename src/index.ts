import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── Configuración ───────────────────────────────────────────────────────────

const CONFIG = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  chatId: process.env.TELEGRAM_CHAT_ID || '',
  latitude: parseFloat(process.env.LATITUDE || '39.48837067281416'),
  longitude: parseFloat(process.env.LONGITUDE || '-0.4808438442805943'),
  radiusNm: parseInt(process.env.RADIUS_NM || '27', 10),
  checkIntervalMinutes: parseInt(process.env.CHECK_INTERVAL_MINUTES || '5', 10),
  cooldownMinutes: parseInt(process.env.COOLDOWN_MINUTES || '30', 10),
};

function validateConfig(): void {
  const missing: string[] = [];
  if (!CONFIG.telegramToken) missing.push('TELEGRAM_BOT_TOKEN');
  if (!CONFIG.chatId) missing.push('TELEGRAM_CHAT_ID');

  if (missing.length > 0) {
    console.error(`❌ Faltan variables en .env: ${missing.join(', ')}`);
    console.error('   Copia .env.example a .env y rellena los valores.');
    process.exit(1);
  }
}

// ─── Tipos de aviones molones ────────────────────────────────────────────────

const COOL_PLANE_PATTERNS = [
  /^A380$/i,
  /^A388$/i,
  /^B74[0-9]$/i,      // B747 familia
  /^B78[0-9X]$/i,     // B787 familia
  /^A35[0-9K]$/i,     // A350 familia
  /^A340$/i,
  /^A346$/i,
  /^A345$/i,
  /^B77[0-9LWX]$/i,   // B777 familia
  /^B76[0-9]$/i,      // B767 familia (¡tu UPS de Manises!)
];

function isCoolPlane(type: string | undefined): boolean {
  if (!type) return false;
  return COOL_PLANE_PATTERNS.some((pattern) => pattern.test(type));
}

// ─── Interfaces ADSB.lol ─────────────────────────────────────────────────────

interface Aircraft {
  hex: string;
  type: string;
  flight?: string;
  r?: string;               // registro/matricula
  t?: string;               // tipo de avion
  alt_baro?: number;
  alt_geom?: number;
  gs?: number;              // ground speed (nudos)
  track?: number;           // rumbo en grados
  lat?: number;
  lon?: number;
  dst?: number;             // distancia en millas nauticas
  dir?: number;             // direccion desde receptor en grados
  seen_pos?: number;
  seen?: number;
  rssi?: number;
  emergency?: string;
  category?: string;
}

interface AdsbLolResponse {
  ac: Aircraft[];
  msg: string;
  now: number;
  total: number;
  ctime: number;
  ptime: number;
}

interface RouteInfo {
  _airport_codes_iata?: string[];
  _airport_codes_icao?: string[];
}

interface FlightRouteResponse {
  route?: string;
  _airport_codes_iata?: string[];
  _airport_codes_icao?: string[];
}

// ─── Deduplicación ───────────────────────────────────────────────────────────

const notifiedAircraft = new Map<string, number>();

function isInCooldown(hex: string): boolean {
  const lastNotified = notifiedAircraft.get(hex);
  if (!lastNotified) return false;

  const cooldownMs = CONFIG.cooldownMinutes * 60 * 1000;
  return Date.now() - lastNotified < cooldownMs;
}

function markNotified(hex: string): void {
  notifiedAircraft.set(hex, Date.now());
}

// Limpiar entradas antiguas cada 2 horas para evitar memory leaks
setInterval(() => {
  const cutoff = Date.now() - (CONFIG.cooldownMinutes * 60 * 1000);
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
}, 2 * 60 * 60 * 1000);

// ─── Helper: Dirección cardinal ──────────────────────────────────────────────

function getCardinalDirection(degrees: number | undefined): string {
  if (degrees === undefined) return 'Desconocida';
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

// ─── Helper: Formatear tipo de avión ─────────────────────────────────────────

function getPlaneName(type: string): string {
  const names: Record<string, string> = {
    A380: 'Airbus A380',
    A388: 'Airbus A380-800',
    B747: 'Boeing 747',
    B744: 'Boeing 747-400',
    B748: 'Boeing 747-8',
    B787: 'Boeing 787 Dreamliner',
    B788: 'Boeing 787-8',
    B789: 'Boeing 787-9',
    B78X: 'Boeing 787-10',
    A350: 'Airbus A350',
    A359: 'Airbus A350-900',
    A35K: 'Airbus A350-1000',
    A340: 'Airbus A340',
    A346: 'Airbus A340-600',
    A345: 'Airbus A340-500',
    B777: 'Boeing 777',
    B772: 'Boeing 777-200',
    B773: 'Boeing 777-300',
    B77W: 'Boeing 777-300ER',
    B77L: 'Boeing 777-200LR',
    B767: 'Boeing 767',
    B763: 'Boeing 767-300',
    B762: 'Boeing 767-200',
  };
  return names[type.toUpperCase()] || type;
}

// ─── Obtener ruta del vuelo ──────────────────────────────────────────────────

async function getFlightRoute(hex: string, callsign?: string): Promise<{ origin?: string; destination?: string }> {
  try {
    // Intentar por hex primero
    const hexResponse = await axios.get(`https://api.adsb.lol/v2/hex/${hex}`, {
      timeout: 5000,
    });

    const data = hexResponse.data as { ac?: Aircraft[]; route?: string; _airport_codes_icao?: string[] };

    if (data._airport_codes_icao && data._airport_codes_icao.length >= 2) {
      return {
        origin: data._airport_codes_icao[0],
        destination: data._airport_codes_icao[1],
      };
    }

    if (data.route) {
      const parts = data.route.split('-');
      if (parts.length >= 2) {
        return { origin: parts[0], destination: parts[parts.length - 1] };
      }
    }
  } catch {
    // Ignorar error, intentar por callsign
  }

  if (callsign) {
    try {
      const cleanCallsign = callsign.trim();
      const flightResponse = await axios.get(`https://api.adsb.lol/v2/flight/${cleanCallsign}`, {
        timeout: 5000,
      });

      const data = flightResponse.data as { ac?: Aircraft[]; route?: string; _airport_codes_icao?: string[] };

      if (data._airport_codes_icao && data._airport_codes_icao.length >= 2) {
        return {
          origin: data._airport_codes_icao[0],
          destination: data._airport_codes_icao[1],
        };
      }

      if (data.route) {
        const parts = data.route.split('-');
        if (parts.length >= 2) {
          return { origin: parts[0], destination: parts[parts.length - 1] };
        }
      }
    } catch {
      // Ignorar error
    }
  }

  return {};
}

// ─── Construir mensaje de Telegram ───────────────────────────────────────────

function buildMessage(plane: Aircraft, route: { origin?: string; destination?: string }): string {
  const type = plane.t || 'Desconocido';
  const name = getPlaneName(type);
  const callsign = plane.flight ? plane.flight.trim() : 'Desconocido';
  const registration = plane.r || 'Desconocida';
  const distanceKm = plane.dst ? (plane.dst * 1.852).toFixed(1) : '?';
  const direction = getCardinalDirection(plane.dir);
  const altitude = plane.alt_baro !== undefined ? `${plane.alt_baro.toLocaleString()} pies` : 'Desconocida';
  const speed = plane.gs !== undefined ? `${Math.round(plane.gs * 1.852)} km/h` : 'Desconocida';
  const track = plane.track !== undefined ? `${Math.round(plane.track)}°` : '?';

  let message = `🛩️ *¡Avión molón detectado!*\n\n`;
  message += `✈️ *Tipo:* ${name} (${type})\n`;
  message += `📞 *Callsign:* \`${callsign}\`\n`;
  message += `🔢 *Registro:* \`${registration}\`\n`;
  message += `📍 *Distancia:* ${distanceKm} km\n`;
  message += `🧭 *Dirección:* ${direction} (${plane.dir?.toFixed(1) ?? '?'}°)\n`;
  message += `📐 *Rumbo:* ${track}\n`;
  message += `📏 *Altitud:* ${altitude}\n`;
  message += `💨 *Velocidad:* ${speed}\n`;

  if (route.origin && route.destination) {
    message += `\n🛫 *Origen:* ${route.origin}\n`;
    message += `🛬 *Destino:* ${route.destination}\n`;
  }

  if (callsign !== 'Desconocido') {
    message += `\n🗺️ [Ver en Flightradar24](https://www.flightradar24.com/${callsign})`;
  }

  return message;
}

// ─── Fetch de aviones ────────────────────────────────────────────────────────

async function fetchAircraft(): Promise<Aircraft[]> {
  const url = `https://api.adsb.lol/v2/point/${CONFIG.latitude}/${CONFIG.longitude}/${CONFIG.radiusNm}`;
  console.log(`🔍 Consultando ADSB.lol: ${url}`);

  try {
    const response = await axios.get<AdsbLolResponse>(url, {
      timeout: 15000,
      headers: { Accept: 'application/json' },
    });

    if (response.data.msg !== 'No error') {
      console.warn(`⚠️ ADSB.lol respondió con msg: ${response.data.msg}`);
      return [];
    }

    console.log(`📡 Total aviones en zona: ${response.data.total}`);
    return response.data.ac || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`❌ Error HTTP ${error.response?.status}: ${error.message}`);
    } else {
      console.error('❌ Error desconocido:', error);
    }
    return [];
  }
}

// ─── Procesar y notificar ────────────────────────────────────────────────────

async function processAndNotify(planes: Aircraft[], bot: TelegramBot): Promise<void> {
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

    try {
      await bot.sendMessage(CONFIG.chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      });
      markNotified(plane.hex);
      console.log(`✅ Notificación enviada: ${plane.flight?.trim() || plane.hex}`);
    } catch (error) {
      console.error(`❌ Error enviando mensaje a Telegram:`, error);
    }
  }
}

// ─── Loop principal ──────────────────────────────────────────────────────────

async function main(): Promise<void> {
  validateConfig();

  const bot = new TelegramBot(CONFIG.telegramToken, { polling: false });

  // Enviar mensaje de inicio
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

  const intervalMs = CONFIG.checkIntervalMinutes * 60 * 1000;

  console.log(`\n🚀 Plane Bot arrancado`);
  console.log(`   📍 ${CONFIG.latitude}, ${CONFIG.longitude}`);
  console.log(`   📏 Radio: ${CONFIG.radiusNm} nm`);
  console.log(`   ⏱️ Intervalo: ${CONFIG.checkIntervalMinutes} min`);
  console.log(`   🕒 Cooldown: ${CONFIG.cooldownMinutes} min`);
  console.log(`   ✈️ Tipos: A380, B747, B787, A350, A340, B777, B767\n`);

  // Primera ejecución inmediata
  const planes = await fetchAircraft();
  await processAndNotify(planes, bot);

  // Loop periódico
  setInterval(async () => {
    const planes = await fetchAircraft();
    await processAndNotify(planes, bot);
  }, intervalMs);
}

main().catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
