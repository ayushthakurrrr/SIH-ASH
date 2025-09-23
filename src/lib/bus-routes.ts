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
        name: 'Route 1: Downtown Loop',
        buses: ['Bus-01', 'Bus-02', 'Bus-42'],
        stops: [
            { name: 'Civic Center', position: { lat: 37.7749, lng: -122.4194 } },
            { name: 'Union Square', position: { lat: 37.78, lng: -122.41 } },
            { name: 'Ferry Building', position: { lat: 37.7955, lng: -122.3937 } },
        ],
        path: [
            { lat: 37.7749, lng: -122.4194 },
            { lat: 37.78, lng: -122.415 },
            { lat: 37.78, lng: -122.41 },
            { lat: 37.788, lng: -122.405 },
            { lat: 37.7955, lng: -122.3937 },
            { lat: 37.785, lng: -122.40, },
            { lat: 37.7749, lng: -122.4194 },
        ]
    },
    {
        id: 'route-2',
        name: 'Route 2: Golden Gate Express',
        buses: ['Bus-03', 'Bus-04'],
        stops: [
            { name: 'Marina District', position: { lat: 37.79, lng: -122.43 } },
            { name: 'Golden Gate Bridge', position: { lat: 37.81, lng: -122.47 } },
            { name: 'Sausalito', position: { lat: 37.859, lng: -122.4852 } },
        ],
        path: [
            { lat: 37.79, lng: -122.43 },
            { lat: 37.80, lng: -122.45 },
            { lat: 37.81, lng: -122.47 },
            { lat: 37.82, lng: -122.475 },
            { lat: 37.859, lng: -122.4852 }
        ]
    }
];
