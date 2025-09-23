export type BusRoute = {
    id: string;
    name: string;
    buses: string[];
    stops: { name: string; position: { lat: number; lng: number }, scheduledTime: string }[];
    path: { lat: number; lng: number }[];
};

// This data is now seeded into Firestore and fetched from there.
// This file is kept for type definitions and for the seeding script.
export const busRoutes: BusRoute[] = [
    {
        id: 'route-1',
        name: 'Route 1: BRTS Corridor',
        buses: ['MP-09-1A', 'MP-09-2B', 'Bus-42'],
        stops: [
            { name: 'Rajiv Gandhi Square', position: { lat: 22.706, lng: 75.873 }, scheduledTime: '10:00 AM' },
            { name: 'Indrapuri', position: { lat: 22.715, lng: 75.880 }, scheduledTime: '10:08 AM' },
            { name: 'Geeta Bhawan', position: { lat: 22.720, lng: 75.885 }, scheduledTime: '10:15 AM' },
            { name: 'Palasia Square', position: { lat: 22.727, lng: 75.891 }, scheduledTime: '10:22 AM' },
            { name: 'Vijay Nagar Square', position: { lat: 22.752, lng: 75.894 }, scheduledTime: '10:35 AM' },
        ],
        path: [
            { lat: 22.7053, lng: 75.8727 },
            { lat: 22.7058, lng: 75.8732 },
            { lat: 22.7065, lng: 75.8738 },
            { lat: 22.7083, lng: 75.8753 },
            { lat: 22.71, lng: 75.8767 },
            { lat: 22.7113, lng: 75.8778 },
            { lat: 22.7126, lng: 75.8788 },
            { lat: 22.7142, lng: 75.8801 },
            { lat: 22.7157, lng: 75.8814 },
            { lat: 22.7171, lng: 75.8826 },
            { lat: 22.7188, lng: 75.8841 },
            { lat: 22.7202, lng: 75.8853 },
            { lat: 22.7214, lng: 75.8863 },
            { lat: 22.7229, lng: 75.8876 },
            { lat: 22.7252, lng: 75.8894 },
            { lat: 22.727, lng: 75.8909 },
            { lat: 22.728, lng: 75.8911 },
            { lat: 22.7303, lng: 75.8915 },
            { lat: 22.7324, lng: 75.8918 },
            { lat: 22.735, lng: 75.8923 },
            { lat: 22.7382, lng: 75.8928 },
            { lat: 22.7419, lng: 75.8934 },
            { lat: 22.7451, lng: 75.8939 },
            { lat: 22.7482, lng: 75.8944 },
            { lat: 22.751, lng: 75.8948 },
            { lat: 22.7525, lng: 75.8943 },
        ]
    },
    {
        id: 'route-2',
        name: 'Route 2: City Circle',
        buses: ['MP-09-3C', 'MP-09-4D'],
        stops: [
            { name: 'Sarwate Bus Stand', position: { lat: 22.712, lng: 75.861 }, scheduledTime: '11:00 AM' },
            { name: 'Rajwada Palace', position: { lat: 22.717, lng: 75.855 }, scheduledTime: '11:10 AM' },
            { name: 'Bada Ganpati', position: { lat: 22.721, lng: 75.842 }, scheduledTime: '11:20 AM' },
            { name: 'Annapurna Temple', position: { lat: 22.697, lng: 75.833 }, scheduledTime: '11:35 AM' },
        ],
        path: [
            { lat: 22.7122, lng: 75.8611 },
            { lat: 22.7126, lng: 75.8604 },
            { lat: 22.7135, lng: 75.859 },
            { lat: 22.7153, lng: 75.8566 },
            { lat: 22.7169, lng: 75.8549 },
            { lat: 22.718, lng: 75.8532 },
            { lat: 22.7197, lng: 75.8499 },
            { lat: 22.7208, lng: 75.8459 },
            { lat: 22.7212, lng: 75.8424 },
            { lat: 22.7196, lng: 75.8415 },
            { lat: 22.715, lng: 75.8392 },
            { lat: 22.7118, lng: 75.8376 },
            { lat: 22.7058, lng: 75.8349 },
            { lat: 22.7011, lng: 75.8333 },
            { lat: 22.6972, lng: 75.8327 },
            { lat: 22.6978, lng: 75.8354 },
            { lat: 22.6989, lng: 75.8402 },
            { lat: 22.7011, lng: 75.8465 },
            { lat: 22.7032, lng: 75.8509 },
            { lat: 22.7067, lng: 75.8566 },
            { lat: 22.7099, lng: 75.8596 },
            { lat: 22.7122, lng: 75.8611 },
        ]
    }
];
