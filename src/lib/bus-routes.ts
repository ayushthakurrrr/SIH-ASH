export type BusRoute = {
    id: string;
    name: string;
    buses: string[];
    stops: { name: string; position: { lat: number; lng: number } }[];
    path: { lat: number; lng: number }[];
};

export const busRoutes: BusRoute[] = [
    {
        id: 'route-1',
        name: 'Route 1: BRTS Corridor',
        buses: ['MP-09-1A', 'MP-09-2B', 'Bus-42'],
        stops: [
            { name: 'Rajiv Gandhi Square', position: { lat: 22.706, lng: 75.873 } },
            { name: 'Indrapuri', position: { lat: 22.715, lng: 75.880 } },
            { name: 'Geeta Bhawan', position: { lat: 22.720, lng: 75.885 } },
            { name: 'Palasia Square', position: { lat: 22.727, lng: 75.891 } },
            { name: 'Vijay Nagar Square', position: { lat: 22.752, lng: 75.894 } },
        ],
        path: [
            { lat: 22.706, lng: 75.873 },
            { lat: 22.710, lng: 75.876 },
            { lat: 22.715, lng: 75.880 },
            { lat: 22.720, lng: 75.885 },
            { lat: 22.727, lng: 75.891 },
            { lat: 22.735, lng: 75.892 },
            { lat: 22.752, lng: 75.894 },
        ]
    },
    {
        id: 'route-2',
        name: 'Route 2: City Circle',
        buses: ['MP-09-3C', 'MP-09-4D'],
        stops: [
            { name: 'Sarwate Bus Stand', position: { lat: 22.712, lng: 75.861 } },
            { name: 'Rajwada Palace', position: { lat: 22.717, lng: 75.855 } },
            { name: 'Bada Ganpati', position: { lat: 22.721, lng: 75.842 } },
            { name: 'Annapurna Temple', position: { lat: 22.697, lng: 75.833 } },
        ],
        path: [
            { lat: 22.712, lng: 75.861 },
            { lat: 22.715, lng: 75.858 },
            { lat: 22.717, lng: 75.855 },
            { lat: 22.720, lng: 75.850 },
            { lat: 22.721, lng: 75.842 },
            { lat: 22.715, lng: 75.838 },
            { lat: 22.697, lng: 75.833 },
            { lat: 22.705, lng: 75.845 },
            { lat: 22.712, lng: 75.861 },
        ]
    }
];
