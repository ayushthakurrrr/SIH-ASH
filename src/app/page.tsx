"use client";

import { useState, useEffect, type FC } from 'react';
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { io, type Socket } from 'socket.io-client';
import { Bus, WifiOff } from 'lucide-react';
import type { LocationUpdate } from '@/types';
import BusMarker from '@/components/BusMarker';

type BusLocations = Record<string, { lat: number; lng: number }>;

const Header: FC = () => (
  <header className="flex items-center gap-3 p-4 bg-card border-b shadow-sm">
    <Bus size={32} className="text-primary" />
    <h1 className="text-2xl font-bold text-foreground">LiveTrack</h1>
  </header>
);

const MissingApiKey: FC = () => (
  <div className="flex flex-col items-center justify-center h-full gap-4 text-center bg-muted/50">
    <WifiOff size={48} className="text-destructive" />
    <div className="max-w-md">
      <h2 className="text-xl font-semibold text-destructive">Configuration Error</h2>
      <p className="text-muted-foreground mt-2">
        The Google Maps API key is missing. Please add it to your environment variables as <code className="font-semibold text-foreground bg-border px-1 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to display the map.
      </p>
    </div>
  </div>
);

export default function UserMapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [buses, setBuses] = useState<BusLocations>({});
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('initialLocations', (initialBuses: BusLocations) => {
      setBuses(initialBuses);
    });

    newSocket.on('locationUpdate', (data: LocationUpdate) => {
      setBuses((prevBuses) => ({
        ...prevBuses,
        [data.busId]: data.location,
      }));
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);
  
  const mapCenter = { lat: 37.7749, lng: -122.4194 }; // San Francisco

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-grow">
        {apiKey ? (
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={mapCenter}
              defaultZoom={12}
              gestureHandling={'greedy'}
              disableDefaultUI={true}
              mapId="livetrack-map"
            >
              {Object.entries(buses).map(([id, pos]) => (
                <BusMarker key={id} position={pos} busId={id} />
              ))}
            </Map>
          </APIProvider>
        ) : (
          <MissingApiKey />
        )}
      </main>
    </div>
  );
}
