
export type BusRoute = {
    id: string;
    name: string;
    buses: string[];
    stops: { name: string; position: { lat: number; lng: number }, scheduledTime: string }[];
};

// This data is now seeded into Firestore and fetched from there.
// The 'path' property has been removed as it will now be dynamically generated.
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
    },
    {
        id: 'route-3',
        name: 'Route 3: Airport Express',
        buses: ['MP-09-5E', 'MP-09-6F'],
        stops: [
            { name: 'Sarwate Bus Stand', position: { lat: 22.712, lng: 75.861 }, scheduledTime: '12:00 PM' },
            { name: 'Railway Station', position: { lat: 22.715, lng: 75.866 }, scheduledTime: '12:05 PM' },
            { name: 'Collectorate', position: { lat: 22.718, lng: 75.875 }, scheduledTime: '12:15 PM' },
            { name: 'Devi Ahilya Bai Holkar Airport', position: { lat: 22.723, lng: 75.802 }, scheduledTime: '12:45 PM' },
        ],
    },
    {
        id: 'route-4',
        name: 'Route 4: University Link',
        buses: ['MP-09-7G', 'MP-09-8H'],
        stops: [
            { name: 'Bhawarkua Square', position: { lat: 22.688, lng: 75.872 }, scheduledTime: '01:00 PM' },
            { name: 'Holkar College', position: { lat: 22.700, lng: 75.873 }, scheduledTime: '01:10 PM' },
            { name: 'DAVV University', position: { lat: 22.721, lng: 75.878 }, scheduledTime: '01:25 PM' },
            { name: 'Khandwa Naka', position: { lat: 22.670, lng: 75.875 }, scheduledTime: '01:40 PM' },
        ],
    },
    {
        id: 'route-5',
        name: 'Route 5: IT Park Shuttle',
        buses: ['MP-09-9I', 'MP-09-10J'],
        stops: [
            { name: 'Vijay Nagar Square', position: { lat: 22.752, lng: 75.894 }, scheduledTime: '02:00 PM' },
            { name: 'Radisson Square', position: { lat: 22.750, lng: 75.912 }, scheduledTime: '02:10 PM' },
            { name: 'Crystal IT Park', position: { lat: 22.745, lng: 75.898 }, scheduledTime: '02:25 PM' },
            { name: 'Bhawarkua Square', position: { lat: 22.688, lng: 75.872 }, scheduledTime: '02:50 PM' },
        ],
    },
    {
        id: 'route-6',
        name: 'Route 6: South Circle',
        buses: ['MP-09-11K', 'MP-09-12L'],
        stops: [
            { name: 'Mhow Naka', position: { lat: 22.702, lng: 75.850 }, scheduledTime: '03:00 PM' },
            { name: 'Tower Square', position: { lat: 22.695, lng: 75.855 }, scheduledTime: '03:10 PM' },
            { name: 'Ranjeet Hanuman', position: { lat: 22.710, lng: 75.835 }, scheduledTime: '03:25 PM' },
            { name: 'Vaishnav College', position: { lat: 22.705, lng: 75.825 }, scheduledTime: '03:40 PM' },
        ],
    },
    {
        id: 'route-7',
        name: 'Route 7: East-West Connector',
        buses: ['MP-09-13M', 'MP-09-14N'],
        stops: [
            { name: 'Bengali Square', position: { lat: 22.730, lng: 75.920 }, scheduledTime: '04:00 PM' },
            { name: 'Khajrana Square', position: { lat: 22.740, lng: 75.905 }, scheduledTime: '04:15 PM' },
            { name: 'Bombay Hospital', position: { lat: 22.755, lng: 75.900 }, scheduledTime: '04:25 PM' },
            { name: 'MR-9 Square', position: { lat: 22.745, lng: 75.885 }, scheduledTime: '04:40 PM' },
        ],
    },
    {
        id: 'route-8',
        name: 'Route 8: Outer Ring',
        buses: ['MP-09-15O', 'MP-09-16P'],
        stops: [
            { name: 'Super Corridor', position: { lat: 22.770, lng: 75.800 }, scheduledTime: '05:00 PM' },
            { name: 'MR-10', position: { lat: 22.765, lng: 75.890 }, scheduledTime: '05:20 PM' },
            { name: 'Bypass Road', position: { lat: 22.730, lng: 75.940 }, scheduledTime: '05:40 PM' },
            { name: 'Rau Circle', position: { lat: 22.650, lng: 75.820 }, scheduledTime: '06:00 PM' },
        ],
    },
    {
        id: 'route-9',
        name: 'Route 9: Dewas Link',
        buses: ['MP-41-1Q', 'MP-41-2R'],
        stops: [
            { name: 'Ujjain Dewas Bypass', position: { lat: 22.984, lng: 76.046 }, scheduledTime: '08:00 AM' },
            { name: 'Dewas Bus Stand', position: { lat: 22.964, lng: 76.061 }, scheduledTime: '08:15 AM' },
            { name: 'Tata International Dewas', position: { lat: 22.955, lng: 76.004 }, scheduledTime: '08:30 AM' },
        ],
    },
    {
        id: 'route-10',
        name: 'Route 10: Dewas-Ujjain',
        buses: ['MP-41-3S', 'MP-41-4T'],
        stops: [
            { name: 'Dewas Bus Stand', position: { lat: 22.964, lng: 76.061 }, scheduledTime: '09:00 AM' },
            { name: 'Ujjain Bus Stand', position: { lat: 23.1793, lng: 75.7849 }, scheduledTime: '09:45 AM' },
        ],
    },
    {
        id: 'route-11',
        name: 'Route 11: Ujjain Local',
        buses: ['MP-13-1U', 'MP-13-2V'],
        stops: [
            { name: 'Pipefactory Square', position: { lat: 23.1856, lng: 75.7600 }, scheduledTime: '10:00 AM' },
            { name: 'Ujjain Engineering College', position: { lat: 23.1785, lng: 75.7598 }, scheduledTime: '10:10 AM' },
            { name: 'Nanakheda Bus Stand', position: { lat: 23.1558, lng: 75.7725 }, scheduledTime: '10:25 AM' },
        ],
    }
];
