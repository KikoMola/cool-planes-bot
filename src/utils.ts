export function getCardinalDirection(degrees: number | undefined): string {
    if (degrees === undefined) return 'Desconocida';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}


export function getPlaneName(type: string): string {
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
        A330: 'Airbus A330',
        A332: 'Airbus A330-200',
        A333: 'Airbus A330-300',
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
