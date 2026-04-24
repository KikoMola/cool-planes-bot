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

export interface AircraftImage {
    buffer: Buffer;
    photographer: string;
}

export async function getAircraftImage(hex: string): Promise<AircraftImage | undefined> {
    let imageUrl: string | undefined;
    let photographer = 'Desconocido';

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
            imageUrl = photos[0].thumbnail_large?.src || photos[0].thumbnail?.src;
            photographer = photos[0].photographer || 'Desconocido';
        }
    } catch {
        return undefined;
    }

    if (!imageUrl) return undefined;

    try {
        const imageResponse = await axios.get(imageUrl, {
            timeout: 10000,
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'PlaneBot/1.0',
            },
        });

        return {
            buffer: Buffer.from(imageResponse.data),
            photographer,
        };
    } catch {
        return undefined;
    }
}
