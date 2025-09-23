"use client";

import { useState, useEffect, useMemo, type FC, useCallback } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { io, type Socket } from 'socket.io-client';
import { Bus, WifiOff, Route, Clock, PersonStanding, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import type { LocationUpdate } from '@/types';
import BusMarker from '@/components/BusMarker';
import StopMarker from '@/components/StopMarker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { busRoutes } from '@/lib/bus-routes';
import Polyline from '@/components/Polyline';
import { getEta } from '@/ai/flows/get-eta-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

type BusLocations = Record<string, { lat: number; lng: number }>;
type Etas = Record<string, { duration: number, distance: number } | null>;

const allStops = busRoutes.flatMap(route => route.stops.map(stop => stop.name));
const uniqueStops = [...new Set(allStops)];

const Header: FC<{
  source: string | null;
  destination: string | null;
  onSourceSelect: (stop: string) => void;
  onDestinationSelect: (stop: string) => void;
  busCount: number;
}> = ({ source, destination, onSourceSelect, onDestinationSelect, busCount }) => (
  <header className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-card border-b shadow-sm z-10 shrink-0">
    <div className="flex items-center gap-3">
      <Bus size={32} className="text-primary" />
      <h1 className="text-2xl font-bold text-foreground">LiveTrack</h1>
    </div>
    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
          <span>{busCount} {busCount === 1 ? 'Bus' : 'Buses'} Online</span>
      </div>
      <Select onValueChange={onSourceSelect} value={source || undefined}>
        <SelectTrigger className="w-full md:w-[240px]">
          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Select Source" />
        </SelectTrigger>
        <SelectContent>
          {uniqueStops.map((stop) => (
            <SelectItem key={`source-${stop}`} value={stop}>{stop}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select onValueChange={onDestinationSelect} value={destination || undefined}>
        <SelectTrigger className="w-full md:w-[240px]">
          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Select Destination" />
        </SelectTrigger>
        <SelectContent>
          {uniqueStops.map((stop) => (
            <SelectItem key={`dest-${stop}`} value={stop}>{stop}</SelectItem>
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

const EtaDisplay: FC<{
    stopName: string, 
    eta: {duration: number, distance: number} | null | undefined,
    scheduledTime: string,
}> = ({stopName, eta, scheduledTime}) => {

    const getStatus = () => {
        if (eta === undefined || eta === null) return null;

        const now = new Date();
        const arrivalTime = new Date(now.getTime() + eta.duration * 1000);

        const [time, modifier] = scheduledTime.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (modifier === 'PM' && hours < 12) {
            hours += 12;
        }
        if (modifier === 'AM' && hours === 12) {
            hours = 0;
        }

        const scheduledDateTime = new Date();
        scheduledDateTime.setHours(hours, minutes, 0, 0);
        
        const diffMinutes = Math.round((arrivalTime.getTime() - scheduledDateTime.getTime()) / 60000);

        if (diffMinutes > 2) {
            return <span className="text-sm font-semibold text-destructive">{diffMinutes} min late</span>;
        }
        if (diffMinutes < -2) {
            return <span className="text-sm font-semibold text-green-600">{-diffMinutes} min early</span>;
        }
        return <span className="text-sm font-semibold text-blue-600">On Time</span>;
    };
    
    return (
        <div className="flex flex-col items-start gap-1 w-full">
            <span className="font-semibold">{stopName}</span>
            {eta === undefined && ( // Loading state
                 <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/4" />
                </div>
            )}
            {eta === null && ( // No bus nearby
                <span className="text-sm text-muted-foreground">No bus nearby</span>
            )}
            {eta && ( // ETA available
                <div className="flex items-center justify-between text-sm w-full">
                    <div className="flex items-center gap-2 text-primary">
                        <Clock className="h-4 w-4"/>
                        <span className='font-semibold'>~ {Math.round(eta.duration / 60)} min</span>
                        <span className="text-xs text-muted-foreground">({ (eta.distance / 1000).toFixed(1)} km)</span>
                    </div>
                    {getStatus()}
                </div>
            )}
             <div className="text-xs text-muted-foreground">
                Scheduled for {scheduledTime}
            </div>
        </div>
    );
}

const FitBounds: FC<{ points: { lat: number; lng: number }[] }> = ({ points }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || points.length === 0) return;

        if (points.length === 1) {
            map.setCenter(points[0]);
            map.setZoom(14);
            return;
        }

        const bounds = new google.maps.LatLngBounds();
        points.forEach(point => bounds.extend(point));
        map.fitBounds(bounds, 100); // 100 is padding in pixels
    }, [map, points]);

    return null;
}

export default function UserMapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [allBuses, setAllBuses] = useState<BusLocations>({});
  const [sourceStop, setSourceStop] = useState<string | null>(null);
  const [destinationStop, setDestinationStop] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [etas, setEtas] = useState<Etas>({});
  const [isEtaLoading, setIsEtaLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
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

  useEffect(() => {
    if (sourceStop && destinationStop && sourceStop !== destinationStop) {
      const foundRoute = busRoutes.find(route => {
        const sourceIndex = route.stops.findIndex(s => s.name === sourceStop);
        const destIndex = route.stops.findIndex(s => s.name === destinationStop);
        return sourceIndex !== -1 && destIndex !== -1 && sourceIndex < destIndex;
      });

      if (foundRoute) {
        setSelectedRouteId(foundRoute.id);
        setIsPanelOpen(true);
      } else {
        setSelectedRouteId(null);
        setIsPanelOpen(false);
      }
    } else {
      setSelectedRouteId(null);
      setIsPanelOpen(false);
    }
  }, [sourceStop, destinationStop]);

  const selectedRoute = useMemo(() => 
    selectedRouteId ? busRoutes.find(r => r.id === selectedRouteId) : null,
  [selectedRouteId]);
  
  const visibleBuses = useMemo(() => {
    if (!selectedRoute) {
      // Show all buses if no route is selected
      return allBuses;
    }
    const visible: BusLocations = {};
    for (const busId of selectedRoute.buses) {
      if (allBuses[busId]) {
        visible[busId] = allBuses[busId];
      }
    }
    return visible;
  }, [allBuses, selectedRoute]);
  
  const handleSourceSelect = useCallback((stop: string) => {
    setSourceStop(stop);
  }, []);

  const handleDestinationSelect = useCallback((stop: string) => {
    setDestinationStop(stop);
  }, []);

  useEffect(() => {
    if (!selectedRoute || !isPanelOpen) {
      setEtas({});
      return;
    }

    const calculateEtas = async () => {
      if (Object.keys(visibleBuses).length === 0) {
        const newEtas: Etas = {};
        for (const stop of selectedRoute.stops) {
          newEtas[stop.name] = null;
        }
        setEtas(newEtas);
        setIsEtaLoading(false);
        return;
      }
        
      setIsEtaLoading(true);
      const newEtas: Etas = {};

      const haversineDistance = (coords1: {lat: number, lng: number}, coords2: {lat: number, lng: number}) => {
          const toRad = (x: number) => x * Math.PI / 180;
          const R = 6371; // km
          const dLat = toRad(coords2.lat - coords1.lat);
          const dLon = toRad(coords2.lng - coords1.lng);
          const lat1 = toRad(coords1.lat);
          const lat2 = toRad(coords2.lat);

          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c * 1000; // meters
      }

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
    
    // Use dummy data for now
    const useDummyData = () => {
        if (!selectedRoute) return;
        setIsEtaLoading(true);
        const dummyEtas: Etas = {};
        selectedRoute.stops.forEach((stop, index) => {
            dummyEtas[stop.name] = {
                duration: (index + 1) * 5 * 60, // 5, 10, 15... minutes
                distance: (index + 1) * 1200, // 1.2, 2.4, 3.6... km
            };
        });
        setTimeout(() => {
            setEtas(dummyEtas);
            setIsEtaLoading(false);
        }, 1000)
    };
    
    // calculateEtas();
    useDummyData();
    
    const intervalId = setInterval(useDummyData, 30000);
    return () => clearInterval(intervalId);

  }, [selectedRoute, visibleBuses, isPanelOpen]);

  const allRoutePoints = useMemo(() => {
    if (!selectedRoute) return [];
    const busPoints = Object.values(visibleBuses);
    return [...busPoints, ...selectedRoute.path, ...selectedRoute.stops.map(s => s.position)];
  }, [selectedRoute, visibleBuses]);


  return (
    <div className="flex flex-col h-screen bg-background">
      <Header 
        source={sourceStop}
        destination={destinationStop}
        onSourceSelect={handleSourceSelect}
        onDestinationSelect={handleDestinationSelect}
        busCount={Object.keys(allBuses).length}
      />
      <main className="flex-grow flex flex-col overflow-hidden">
        <div className="flex-grow h-full relative">
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
                    <FitBounds points={allRoutePoints} />
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

        {selectedRoute && (
            <div className="shrink-0 border-t bg-card">
                <button 
                    onClick={() => setIsPanelOpen(!isPanelOpen)}
                    className="w-full p-2 flex items-center justify-center text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                    {isPanelOpen ? (
                        <>
                            <ChevronDown className="mr-2 h-4 w-4" /> Hide Stops
                        </>
                    ) : (
                        <>
                            <ChevronUp className="mr-2 h-4 w-4" /> View Stops
                        </>
                    )}
                </button>
                {isPanelOpen && (
                    <div className="h-[40vh] flex flex-col">
                        <div className="p-4 pb-2 text-left">
                            <h2 className="text-2xl font-bold">{selectedRoute.name}</h2>
                        </div>
                        <ScrollArea className="flex-grow">
                            <div className="p-6 pt-0 space-y-6">
                                {selectedRoute.stops.map((stop, index) => (
                                    <div key={stop.name} className="space-y-3">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center">
                                                <PersonStanding className="h-6 w-6 text-primary" />
                                                {index < selectedRoute.stops.length - 1 && (
                                                    <div className="w-px h-12 bg-border border-dashed"/>
                                                )}
                                            </div>
                                            <EtaDisplay 
                                                stopName={stop.name} 
                                                eta={isEtaLoading ? undefined : etas[stop.name]}
                                                scheduledTime={stop.scheduledTime}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
}
