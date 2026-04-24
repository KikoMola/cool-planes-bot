import axios from 'axios';
import { Aircraft, AdsbLolResponse, RouteInfo } from './types';
import { CONFIG } from './config';

export async function fetchAircraft(): Promise<Aircraft[]> {
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

async function tryGetRouteFromHex(hex: string): Promise<RouteInfo> {
    try {
        const response = await axios.get(`https://api.adsb.lol/v2/hex/${hex}`, {
            timeout: 5000,
        });

        const data = response.data as {
            ac?: Aircraft[];
            route?: string;
            _airport_codes_icao?: string[];
        };

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
    return {};
}

async function tryGetRouteFromCallsign(callsign: string): Promise<RouteInfo> {
    try {
        const cleanCallsign = callsign.trim();
        const response = await axios.get(`https://api.adsb.lol/v2/flight/${cleanCallsign}`, {
            timeout: 5000,
        });

        const data = response.data as {
            ac?: Aircraft[];
            route?: string;
            _airport_codes_icao?: string[];
        };

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
    return {};
}

export async function getFlightRoute(hex: string, callsign?: string): Promise<RouteInfo> {
    const routeFromHex = await tryGetRouteFromHex(hex);
    if (routeFromHex.origin && routeFromHex.destination) {
        return routeFromHex;
    }

    if (callsign) {
        const routeFromCallsign = await tryGetRouteFromCallsign(callsign);
        if (routeFromCallsign.origin && routeFromCallsign.destination) {
            return routeFromCallsign;
        }
    }

    return {};
}
