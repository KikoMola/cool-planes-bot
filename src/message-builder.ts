import { Aircraft, RouteInfo } from './types';
import { getCardinalDirection, getPlaneName } from './utils';

export function buildMessage(plane: Aircraft, route: RouteInfo): string {
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

    return message;
}
