"use client";

import { useState, useEffect, type FC } from 'react';
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { io, type Socket } from 'socket.io-client';
import { Bus, WifiOff, Route } from 'lucide-react';
import type { LocationUpdate } from '@/types';
import BusMarker from '@/components/BusMarker';
import StopMarker from '@/components/StopMarker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { busRoutes } from '@/lib/bus-routes';
import Polyline from '@/components/Polyline';


type BusLocations = Record<string, { lat: number; lng: number }>;

const Header: FC<{
  selectedRoute: string | null;
  onRouteSelect: (routeId: string) => void;
  busCount: number;
}> = ({ selectedRoute, onRouteSelect, busCount }) => (
  <header className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-card border-b shadow-sm">
    <div className="flex items-center gap-3">
      <Bus size={32} className="text-primary" />
      <h1 className="text-2xl font-bold text-foreground">LiveTrack</h1>
    </div>
    <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
            <span>{busCount} {busCount === 1 ? 'Bus' : 'Buses'} Online</span>
        </div>
        <Select onValueChange={(value) => onRouteSelect(value)} value={selectedRoute || undefined}>
            <SelectTrigger className="w-full md:w-[280px]">
                <Route className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Select a Bus Route" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Routes</SelectItem>
                {busRoutes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>{route.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
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
  const [allBuses, setAllBuses] = useState<BusLocations>({});
  const [selectedRouteId, setSelectedRouteId] = useState<string>('all');
  
  useEffect(() => {
    const newSocket = io();

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('initialLocations', (initialBuses: BusLocations) => {
      setAllBuses(initialBuses);
    });

    newSocket.on('locationUpdate', (data: LocationUpdate) => {
      setAllBuses((prevBuses) => ({
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
  
  const mapCenter = { lat: 22.7196, lng: 75.8577 }; // Indore

  const getVisibleBuses = () => {
    if (selectedRouteId === 'all') {
      return allBuses;
    }
    const selectedRoute = busRoutes.find(route => route.id === selectedRouteId);
    if (!selectedRoute) return {};

    const visibleBuses: BusLocations = {};
    for (const busId of selectedRoute.buses) {
        if(allBuses[busId]) {
            visibleBuses[busId] = allBuses[busId];
        }
    }
    return visibleBuses;
  }

  const selectedRoute = selectedRouteId !== 'all' ? busRoutes.find(r => r.id === selectedRouteId) : null;
  const visibleBuses = getVisibleBuses();

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header 
        selectedRoute={selectedRouteId}
        onRouteSelect={setSelectedRouteId}
        busCount={Object.keys(visibleBuses).length}
      />
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
              {Object.entries(visibleBuses).map(([id, pos]) => (
                <BusMarker key={id} position={pos} busId={id} />
              ))}
              {selectedRoute && (
                <>
                  <Polyline
                      path={selectedRoute.path}
                      strokeColor="hsl(var(--primary))"
                      strokeOpacity={0.8}
                      strokeWeight={6}
                  />
                  {selectedRoute.stops.map((stop, index) => (
                    <StopMarker key={`stop-${index}-${stop.name}`} position={stop.position} stopName={stop.name} />
                  ))}
                </>
              )}
            </Map>
          </APIProvider>
        ) : (
          <MissingApiKey />
        )}
      </main>
    </div>
  );
}
