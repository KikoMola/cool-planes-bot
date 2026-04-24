export interface Aircraft {
    hex: string;
    type: string;
    flight?: string;
    r?: string;
    t?: string;
    alt_baro?: number;
    alt_geom?: number;
    gs?: number;
    track?: number;
    lat?: number;
    lon?: number;
    dst?: number;
    dir?: number;
    seen_pos?: number;
    seen?: number;
    rssi?: number;
    emergency?: string;
    category?: string;
}

export interface AdsbLolResponse {
    ac: Aircraft[];
    msg: string;
    now: number;
    total: number;
    ctime: number;
    ptime: number;
}

export interface RouteInfo {
    origin?: string;
    destination?: string;
}
