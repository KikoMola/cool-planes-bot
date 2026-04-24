import axios from 'axios';

interface PlanespottersPhoto {
    id: string;
    thumbnail: {
        src: string;
        size: { width: number; height: number };
    };
    thumbnail_large: {
        src: string;
        size: { width: number; height: number };
    };
    link: string;
    photographer: string;
}

interface PlanespottersResponse {
    photos: PlanespottersPhoto[];
}

export async function getAircraftImageUrl(hex: string): Promise<string | undefined> {
    try {
        const url = `https://api.planespotters.net/pub/photos/hex/${hex}`;
        const response = await axios.get<PlanespottersResponse>(url, {
            timeout: 5000,
            headers: {
                Accept: 'application/json',
                'User-Agent': 'PlaneBot/1.0',
            },
        });

        const photos = response.data.photos;
        if (photos && photos.length > 0) {
            // Usar thumbnail_large (420x280) para mejor calidad en Telegram
            return photos[0].thumbnail_large?.src || photos[0].thumbnail?.src;
        }
    } catch {
        // Silencioso: si falla, simplemente no hay imagen
    }

    return undefined;
}
