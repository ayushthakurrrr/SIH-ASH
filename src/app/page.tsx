"use client";

import { useState, useEffect, type FC } from 'react';
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { io, type Socket } from 'socket.io-client';
import { Bus, WifiOff, Route, Clock, PersonStanding, X } from 'lucide-react';
import type { LocationUpdate } from '@/types';
import BusMarker from '@/components/BusMarker';
import StopMarker from '@/components/StopMarker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { busRoutes } from '@/lib/bus-routes';
import Polyline from '@/components/Polyline';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { getEta } from '@/ai/flows/get-eta-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

type BusLocations = Record<string, { lat: number; lng: number }>;
type Etas = Record<string, { duration: number, distance: number } | null>;


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

const EtaDisplay: FC<{stopName: string, eta: {duration: number, distance: number} | null | undefined}> = ({stopName, eta}) => {
    if (eta === undefined) {
        return (
            <div className="flex flex-col items-start gap-1 w-full">
                <span className="font-semibold">{stopName}</span>
                <div className="flex items-center justify-between w-full">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-5 w-1/4" />
                </div>
            </div>
        )
    }

    if (eta === null) {
        return (
            <div className="flex flex-col items-start gap-1 w-full">
                <span className="font-semibold">{stopName}</span>
                <span className="text-sm text-muted-foreground">No bus nearby</span>
            </div>
        )
    }

    const minutes = Math.round(eta.duration / 60);

    return (
        <div className="flex flex-col items-start gap-1 w-full">
            <span className="font-semibold">{stopName}</span>
            <div className="flex items-center justify-between text-sm w-full">
                <div className="flex items-center gap-2 text-primary font-semibold">
                    <Clock className="h-4 w-4"/>
                    <span>~ {minutes} min</span>
                </div>
                 <span className="text-xs text-muted-foreground">{ (eta.distance / 1000).toFixed(1)} km</span>
            </div>
        </div>
    )
}

export default function UserMapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [allBuses, setAllBuses] = useState<BusLocations>({});
  const [selectedRouteId, setSelectedRouteId] = useState<string>('all');
  const [etas, setEtas] = useState<Etas>({});
  const [isEtaLoading, setIsEtaLoading] = useState(false);
  
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

  const selectedRoute = selectedRouteId !== 'all' ? busRoutes.find(r => r.id === selectedRouteId) : null;
  
  const getVisibleBuses = () => {
    if (!selectedRoute) {
      return allBuses;
    }
    const visibleBuses: BusLocations = {};
    for (const busId of selectedRoute.buses) {
        if(allBuses[busId]) {
            visibleBuses[busId] = allBuses[busId];
        }
    }
    return visibleBuses;
  }

  const visibleBuses = getVisibleBuses();
  
  const handleRouteSelect = (routeId: string) => {
    setSelectedRouteId(routeId);
    setEtas({});
  }

  const haversineDistance = (coords1: {lat: number, lng: number}, coords2: {lat: number, lng: number}) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
    const dLng = (coords2.lng - coords1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  useEffect(() => {
    if (!selectedRoute || Object.keys(visibleBuses).length === 0) {
      setEtas({});
      return;
    }

    const calculateEtas = async () => {
        setIsEtaLoading(true);
        const newEtas: Etas = {};
        for (const stop of selectedRoute.stops) {
            let closestBus: {id: string, location: {lat: number, lng: number}, distance: number} | null = null;
            
            for (const busId in visibleBuses) {
                const distance = haversineDistance(visibleBuses[busId], stop.position);
                if (!closestBus || distance < closestBus.distance) {
                    closestBus = { id: busId, location: visibleBuses[busId], distance };
                }
            }
            
            if (closestBus) {
                try {
                    const etaResult = await getEta({
                        origin: closestBus.location,
                        destination: stop.position,
                    });
                    newEtas[stop.name] = etaResult;
                } catch (e) {
                    console.error("Error fetching ETA for stop", stop.name, e);
                    newEtas[stop.name] = null;
                }
            } else {
                newEtas[stop.name] = null;
            }
        }
        setEtas(newEtas);
        setIsEtaLoading(false);
    }
    
    calculateEtas();
    
    const intervalId = setInterval(calculateEtas, 30000); // Refresh ETAs every 30 seconds
    return () => clearInterval(intervalId);

  }, [selectedRoute, allBuses]);


  return (
    <div className="flex flex-col h-screen bg-background">
      <Header 
        selectedRoute={selectedRouteId}
        onRouteSelect={handleRouteSelect}
        busCount={Object.keys(visibleBuses).length}
      />
      <main className="flex-grow flex">
        <div className='flex-grow relative'>
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
        </div>

        <Sheet open={!!selectedRoute} onOpenChange={(isOpen) => !isOpen && handleRouteSelect('all')}>
            <SheetContent className="w-[380px] sm:w-[420px] p-0 flex flex-col"
                hideCloseButton={true}
            >
                {selectedRoute && (
                    <>
                    <SheetHeader className="p-6 pb-4">
                        <div className="flex items-center justify-between">
                             <SheetTitle className="text-2xl">{selectedRoute.name}</SheetTitle>
                             <button onClick={() => handleRouteSelect('all')} className="p-1 rounded-md hover:bg-muted">
                                <X className="h-5 w-5" />
                             </button>
                        </div>
                    </SheetHeader>
                    <ScrollArea className="flex-grow">
                        <div className="p-6 pt-0 space-y-6">
                            {selectedRoute.stops.map((stop, index) => (
                                <div key={stop.name} className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center">
                                            <PersonStanding className="h-6 w-6 text-primary" />
                                            {index < selectedRoute.stops.length - 1 && (
                                                <div className="w-px h-8 bg-border border-dashed"/>
                                            )}
                                        </div>
                                        <EtaDisplay stopName={stop.name} eta={isEtaLoading && Object.keys(etas).length === 0 ? undefined : etas[stop.name]} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    </>
                )}
            </SheetContent>
        </Sheet>
      </main>
    </div>
  );
}
