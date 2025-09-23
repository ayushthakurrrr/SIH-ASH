export type BusRoute = {
    id: string;
    name: string;
    buses: string[];
    stops: { lat: number; lng: number }[];
    path: { lat: number; lng: number }[];
};

export const busRoutes: BusRoute[] = [
    {
        id: 'route-1',
        name: 'Route 1: Downtown Loop',
        buses: ['Bus-01', 'Bus-02', 'Bus-42'],
        stops: [
            { lat: 37.7749, lng: -122.4194 },
            { lat: 37.78, lng: -122.41 },
            { lat: 37.77, lng: -122.40 },
        ],
        path: [
            { lat: 37.7749, lng: -122.4194 },
            { lat: 37.78, lng: -122.415 },
            { lat: 37.78, lng: -122.41 },
            { lat: 37.775, lng: -122.405 },
            { lat: 37.77, lng: -122.40 },
            { lat: 37.765, lng: -122.41 },
            { lat: 37.7749, lng: -122.4194 },
        ]
    },
    {
        id: 'route-2',
        name: 'Route 2: Golden Gate Express',
        buses: ['Bus-03', 'Bus-04'],
        stops: [
            { lat: 37.79, lng: -122.43 },
            { lat: 37.81, lng: -122.47 },
            { lat: 37.82, lng: -122.475 },
        ],
        path: [
            { lat: 37.79, lng: -122.43 },
            { lat: 37.80, lng: -122.45 },
            { lat: 37.81, lng: -122.47 },
            { lat: 37.82, lng: -122.475 },
        ]
    }
];
