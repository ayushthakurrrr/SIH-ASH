# **App Name**: LiveTrack

## Core Features:

- Driver Location Updates: The driver's website uses the browser's Geolocation API to send GPS coordinates to the server.
- Real-time Server Broadcast: The server receives location updates and broadcasts them to all connected users using Socket.IO.
- User Map Display: The user's website receives location updates and moves the corresponding bus icon on a Mapbox map in real-time.
- Unique Bus IDs: Each bus is assigned a unique ID to ensure accurate location tracking and updates.

## Style Guidelines:

- Primary color: Deep sky blue (#3498db) to convey reliability and precision.
- Background color: Light gray (#ecf0f1) to ensure a clean and unobtrusive backdrop.
- Accent color: Orange (#e67e22) to draw attention to key interactive elements, such as map markers.
- Font: 'Inter', a sans-serif font, will be used for both headlines and body text to maintain a modern and neutral design.
- Use simple, recognizable icons for buses and other map elements.
- Ensure a responsive layout that adapts to different screen sizes for both driver and user websites.
- Employ smooth transitions and subtle animations for bus movement on the map.