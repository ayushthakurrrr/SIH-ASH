

"use client";

import React, { useState, useEffect, useMemo, type FC, useCallback, useRef } from 'react';
import { APIProvider, Map, useMap, AdvancedMarker } from '@vis.gl/react-google-maps';
import { io, type Socket } from 'socket.io-client';
import { Bus, WifiOff, Route, Clock, PersonStanding, ChevronDown, ChevronUp, MapPin, X, RefreshCw, Wifi } from 'lucide-react';
import type { LocationUpdate } from '@/types';
import BusMarker from '@/components/BusMarker';
import StopMarker from '@/components/StopMarker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BusRoute } from '@/lib/bus-routes';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import Polyline from '@/components/Polyline';
import { getEta } from '@/ai/flows/get-eta-flow';
import { getRoutePath } from '@/ai/flows/get-route-path-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type BusLocations = Record<string, { lat: number; lng: number }>;
type Etas = Record<string, { duration: number, distance: number } | null>;
type RoutePath = { lat: number, lng: number }[];


const UserMarker: FC<{ position: { lat: number, lng: number } }> = ({ position }) => {
    return (
        <AdvancedMarker position={position}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500 border-2 border-white shadow-lg">
                           <PersonStanding className="h-5 w-5 text-white" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Your Location</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </AdvancedMarker>
    );
};


const Header: FC<{
  busRoutes: BusRoute[];
  selectedRouteId: string | null;
  source: string | null;
  destination: string | null;
  onRouteSelect: (routeId: string) => void;
  onSourceSelect: (stop: string) => void;
  onDestinationSelect: (stop: string) => void;
  onClear: () => void;
  onRefresh: () => void;
  busCount: number;
}> = ({ busRoutes, selectedRouteId, source, destination, onRouteSelect, onSourceSelect, onDestinationSelect, onClear, onRefresh, busCount }) => {
  const selectedRouteStops = useMemo(() => {
    if (!selectedRouteId) return [];
    const route = busRoutes.find(r => r.id === selectedRouteId);
    return route ? route.stops.map(s => s.name) : [];
  }, [selectedRouteId, busRoutes]);

  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-card border-b shadow-sm z-10 shrink-0">
      <div className="flex items-center gap-3">
        <Bus size={32} className="text-primary" />
        <h1 className="text-2xl font-bold text-foreground">LiveTrack</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground ml-4">
            <span>{busCount} {busCount === 1 ? 'Bus' : 'Buses'} Online</span>
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
        <Select onValueChange={onRouteSelect} value={selectedRouteId || "all"}>
            <SelectTrigger className="w-full md:w-[180px]">
                <Route className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Select Route" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Routes</SelectItem>
                {busRoutes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>{route.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
        <Select onValueChange={onSourceSelect} value={source || undefined} disabled={!selectedRouteId}>
          <SelectTrigger className="w-full md:w-[200px]">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Select Source" />
          </SelectTrigger>
          <SelectContent>
            {selectedRouteStops.map((stop) => (
              <SelectItem key={`source-${stop}`} value={stop}>{stop}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={onDestinationSelect} value={destination || undefined} disabled={!selectedRouteId}>
          <SelectTrigger className="w-full md:w-[200px]">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Select Destination" />
          </SelectTrigger>
          <SelectContent>
            {selectedRouteStops.map((stop) => (
              <SelectItem key={`dest-${stop}`} value={stop}>{stop}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onRefresh} aria-label="Refresh buses and Recenter Map">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClear} aria-label="Clear selection">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};


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

const FitBounds: FC<{ points: { lat: number; lng: number }[], deps?: any[] }> = ({ points, deps = [] }) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, ...deps]);

    return null;
}

const BusDetailsSheet: FC<{
    busId: string | null;
    busRoute: BusRoute | null;
    onOpenChange: (open: boolean) => void;
}> = ({ busId, busRoute, onOpenChange }) => {
    if (!busId || !busRoute) return null;

    return (
        <Sheet open={!!busId} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-3 text-2xl">
                        <Bus className="h-6 w-6 text-primary" />
                        {busId}
                    </SheetTitle>
                    <SheetDescription>
                        Currently running on <span className="font-semibold text-foreground">{busRoute.name}</span>.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                    <h4 className="mb-4 text-lg font-medium">Stops on this Route</h4>
                    <ScrollArea className="h-[70vh] pr-4">
                        <div className="space-y-4">
                            {busRoute.stops.map((stop, index) => (
                                <div key={stop.name} className="flex items-start gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-4 h-4 rounded-full bg-primary/50 flex items-center justify-center mt-1">
                                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                                        </div>
                                        {index < busRoute.stops.length - 1 && (
                                            <div className="w-px h-12 bg-border my-1"/>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{stop.name}</p>
                                        <p className="text-sm text-muted-foreground">Scheduled: {stop.scheduledTime}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </SheetContent>
        </Sheet>
    )
}

const Page = () => {
    const [busRoutes, setBusRoutes] = useState<BusRoute[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoutes = async () => {
            try {
                const db = getFirestore(app);
                const routesCollection = collection(db, 'routes');
                const routesSnapshot = await getDocs(routesCollection);
                const routesList = routesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BusRoute));
                setBusRoutes(routesList);
            } catch (error) {
                console.error("Error fetching routes from Firestore:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRoutes();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Bus className="h-12 w-12 animate-pulse text-primary" />
                    <p className="text-muted-foreground">Loading Routes...</p>
                </div>
            </div>
        )
    }

    return <UserMapPage busRoutes={busRoutes} />;
}


const UserMapPage: FC<{busRoutes: BusRoute[]}> = ({busRoutes}) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { toast } = useToast();
  const [allBuses, setAllBuses] = useState<BusLocations>({});
  const [sourceStop, setSourceStop] = useState<string | null>(null);
  const [destinationStop, setDestinationStop] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [etas, setEtas] = useState<Etas>({});
  const [isEtaLoading, setIsEtaLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [showFullPath, setShowFullPath] = useState(true);
  const [routePath, setRoutePath] = useState<RoutePath | null>(null);
  const [isPathLoading, setIsPathLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [busNavPath, setBusNavPath] = useState<RoutePath | null>(null);
  const [recenterKey, setRecenterKey] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const userLocationWatchId = useRef<number | null>(null);
  
  const MapController: FC = () => {
    const map = useMap();
    useEffect(() => {
        if (!map || !selectedBusId || !userLocation) return;
        
        const busLocation = allBuses[selectedBusId];
        if (!busLocation) return;

        const bounds = new google.maps.LatLngBounds();
        bounds.extend(userLocation);
        bounds.extend(busLocation);
        map.fitBounds(bounds, 150);

    }, [map, selectedBusId, userLocation, allBuses]);

    return null;
  }

  // Define a color palette for the buses
  const busColors = useMemo(() => [
    '#DB4437', '#4285F4', '#F4B400', '#0F9D58',
    '#9C27B0', '#E91E63', '#673AB7', '#3F51B5',
    '#00BCD4', '#009688', '#4CAF50', '#8BC34A',
    '#FFC107', '#FF9800', '#795548', '#607D8B'
  ], []);

  const busColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    const buses = Object.keys(allBuses);
    buses.forEach((busId, index) => {
        map[busId] = busColors[index % busColors.length];
    });
    return map;
  }, [allBuses, busColors]);
  
  useEffect(() => {
    const newSocket = io();
    socketRef.current = newSocket;

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

    newSocket.on('removeBus', (busId: string) => {
      console.log(`Bus ${busId} went offline, removing from map.`);
      setAllBuses((prevBuses) => {
        const newBuses = { ...prevBuses };
        delete newBuses[busId];
        return newBuses;
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Get user's location
    if (navigator.geolocation) {
        userLocationWatchId.current = navigator.geolocation.watchPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            (error) => {
                console.error("Error getting user location:", error);
                toast({
                    variant: "destructive",
                    title: "Could not get your location",
                    description: "Please ensure location services are enabled.",
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
            }
        );
    }

    return () => {
      newSocket.disconnect();
      if (userLocationWatchId.current) {
        navigator.geolocation.clearWatch(userLocationWatchId.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const mapCenter = { lat: 22.7196, lng: 75.8577 }; // Indore

  const selectedRoute = useMemo(() => 
    selectedRouteId ? busRoutes.find(r => r.id === selectedRouteId) : null,
  [selectedRouteId, busRoutes]);
  
    useEffect(() => {
    if (!selectedRoute) {
      setRoutePath(null);
      return;
    }

    const fetchPath = async () => {
      setIsPathLoading(true);
      try {
        const { path } = await getRoutePath({ stops: selectedRoute.stops.map(s => s.position) });
        setRoutePath(path);
      } catch (error) {
        console.error("Error fetching route path:", error);
        toast({
          variant: "destructive",
          title: "Could not fetch route path",
          description: "There was an error fetching the route path from the server.",
        });
        setRoutePath(null);
      } finally {
        setIsPathLoading(false);
      }
    };

    fetchPath();
  }, [selectedRoute, toast]);

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
  
    // Effect to fetch navigation path for the selected bus
    useEffect(() => {
        if (!selectedBusId || !allBuses[selectedBusId]) {
            setBusNavPath(null);
            return;
        }

        const busLocation = allBuses[selectedBusId];
        const busRoute = busRoutes.find(r => r.buses.includes(selectedBusId));
        if (!busRoute) {
            setBusNavPath(null);
            return;
        }

        // Find the next stop for the bus
        let closestStopIndex = -1;
        let minDistance = Infinity;
        busRoute.stops.forEach((stop, index) => {
            const distance = haversineDistance(busLocation, stop.position);
            if (distance < minDistance) {
                minDistance = distance;
                closestStopIndex = index;
            }
        });

        // This is a simplified logic. A real app needs to know bus direction.
        // Assuming the next stop is the one after the physically closest one if it's very near,
        // or the closest one itself if it's further away.
        let nextStopIndex = closestStopIndex;
        if (minDistance < 100 && closestStopIndex < busRoute.stops.length - 1) { // 100m threshold
            nextStopIndex = closestStopIndex + 1;
        }
        
        const nextStop = busRoute.stops[nextStopIndex];
        if (!nextStop) {
            setBusNavPath(null);
            return;
        }

        const fetchNavPath = async () => {
            try {
                const { path } = await getEta({
                    origin: busLocation,
                    destination: nextStop.position,
                });
                if(path) {
                    setBusNavPath(path);
                }
            } catch (error) {
                console.error("Error fetching bus nav path:", error);
                setBusNavPath(null);
            }
        };

        fetchNavPath();

    }, [selectedBusId, allBuses, busRoutes]);


  useEffect(() => {
    if (selectedRouteId) {
      setIsPanelOpen(true);
    }
  
    if (sourceStop && destinationStop) {
        const sourceIndex = busRoutes.find(r => r.id === selectedRouteId)?.stops.findIndex(s => s.name === sourceStop) ?? -1;
        const destIndex = busRoutes.find(r => r.id === selectedRouteId)?.stops.findIndex(s => s.name === destinationStop) ?? -1;

        if (sourceIndex === -1 || destIndex === -1 || sourceIndex >= destIndex) {
            setShowFullPath(true);
            if(sourceStop && destinationStop){
                toast({
                    variant: "destructive",
                    title: "Invalid Stop Selection",
                    description: "Source must come before the destination on this route.",
                });
            }
        } else {
            setShowFullPath(false);
        }
    } else {
        setShowFullPath(true);
    }
  }, [sourceStop, destinationStop, selectedRouteId, busRoutes, toast]);

  const visibleBuses = useMemo(() => {
    if (!selectedRoute) {
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
  
  const handleRouteSelect = useCallback((routeId: string) => {
    if (routeId === "all") {
        setSelectedRouteId(null);
        setIsPanelOpen(false);
    } else {
        setSelectedRouteId(routeId);
    }
    setSourceStop(null);
    setDestinationStop(null);
    setSelectedBusId(null);
    setRecenterKey(k => k + 1);
  }, []);
  
  const handleSourceSelect = useCallback((stop: string) => {
    setSourceStop(stop);
  }, []);

  const handleDestinationSelect = useCallback((stop: string) => {
    setDestinationStop(stop);
  }, []);
  
  const handleClear = useCallback(() => {
    setSourceStop(null);
    setDestinationStop(null);
    setSelectedRouteId(null);
    setIsPanelOpen(false);
    setRoutePath(null);
    setSelectedBusId(null);
    setRecenterKey(k => k + 1);
  }, []);
  
  const handleRefresh = useCallback(() => {
    socketRef.current?.emit('requestInitialLocations');
    setRecenterKey(k => k + 1);
    toast({
        title: "Map Refreshed",
        description: "Bus locations have been updated and map view has been recentered.",
    });
  }, [toast]);
  
  const handleBusClick = useCallback((busId: string) => {
    setSelectedBusId(prevId => prevId === busId ? null : busId);
  }, []);

  const selectedBusRoute = useMemo(() => {
    if (!selectedBusId) return null;
    return busRoutes.find(r => r.buses.includes(selectedBusId)) || null;
  }, [selectedBusId, busRoutes]);


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

      for (const stop of selectedRoute.stops) {
          let closestBus: {id: string, location: {lat: number, lng: number}, distance: number} | null = null;
          
          for (const busId in visibleBuses) {
              const busLocation = visibleBuses[busId];
              const distance = haversineDistance(busLocation, stop.position);
              if (!closestBus || distance < closestBus.distance) {
                  closestBus = { id: busId, location: busLocation, distance };
              }
          }
          
          if (closestBus) {
              try {
                  newEtas[stop.name] = await getEta({
                      origin: closestBus.location,
                      destination: stop.position,
                  });
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
    const intervalId = setInterval(calculateEtas, 30000);
    return () => clearInterval(intervalId);

  }, [selectedRoute, visibleBuses, isPanelOpen]);

  const { allRoutePoints, journeyStops, pathSegments } = useMemo(() => {
    let pointsForBounds = Object.values(visibleBuses);
    if (userLocation) {
        pointsForBounds.push(userLocation);
    }
    
    if (!selectedRoute) {
      return { allRoutePoints: pointsForBounds, journeyStops: [], pathSegments: null };
    }
  
    const sourceIndex = selectedRoute.stops.findIndex(s => s.name === sourceStop);
    const destIndex = selectedRoute.stops.findIndex(s => s.name === destinationStop);
  
    const stopsToDisplay = showFullPath || sourceIndex === -1 || destIndex === -1 || sourceIndex >= destIndex
        ? selectedRoute.stops
        : selectedRoute.stops.slice(sourceIndex, destIndex + 1);

    pointsForBounds.push(...stopsToDisplay.map(s => s.position));

    if (!routePath) {
       return { allRoutePoints: pointsForBounds, journeyStops: stopsToDisplay, pathSegments: null };
    }
    
    // Function to find the closest point on the routePath to a given position
    const findClosestPointOnPath = (pos: {lat: number, lng: number}) => {
        let closestIndex = -1;
        let minDistance = Infinity;

        routePath.forEach((point, index) => {
            const dist = Math.sqrt(Math.pow(point.lat - pos.lat, 2) + Math.pow(point.lng - pos.lng, 2));
            if (dist < minDistance) {
                minDistance = dist;
                closestIndex = index;
            }
        });
        return closestIndex;
    }

    if (sourceIndex === -1 || destIndex === -1 || sourceIndex >= destIndex) {
      return {
        pathSegments: { before: routePath, between: [], after: [] },
        allRoutePoints: pointsForBounds,
        journeyStops: stopsToDisplay,
      };
    }

    const sourcePathIndex = findClosestPointOnPath(selectedRoute.stops[sourceIndex].position);
    const destPathIndex = findClosestPointOnPath(selectedRoute.stops[destIndex].position);
    
    if (sourcePathIndex === -1 || destPathIndex === -1) {
         return {
            pathSegments: { before: routePath, between: [], after: [] },
            allRoutePoints: pointsForBounds,
            journeyStops: stopsToDisplay
         };
    }

    const pathBefore = routePath.slice(0, sourcePathIndex + 1);
    const pathBetween = routePath.slice(sourcePathIndex, destPathIndex + 1);
    const pathAfter = routePath.slice(destPathIndex);
  
    return {
      pathSegments: { before: pathBefore, between: pathBetween, after: pathAfter },
      allRoutePoints: pointsForBounds,
      journeyStops: stopsToDisplay,
    };
  }, [selectedRoute, sourceStop, destinationStop, visibleBuses, showFullPath, routePath, userLocation]);


  return (
    <div className="flex flex-col h-screen bg-background">
      <Header 
        busRoutes={busRoutes}
        selectedRouteId={selectedRouteId}
        source={sourceStop}
        destination={destinationStop}
        onRouteSelect={handleRouteSelect}
        onSourceSelect={handleSourceSelect}
        onDestinationSelect={handleDestinationSelect}
        onClear={handleClear}
        onRefresh={handleRefresh}
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
                    onClick={() => setSelectedBusId(null)}
                >
                <MapController />
                {Object.entries(visibleBuses).map(([id, pos]) => (
                    <BusMarker
                        key={id}
                        position={pos}
                        busId={id}
                        onClick={() => handleBusClick(id)}
                        color={busColorMap[id] || busColors[0]}
                        isSelected={selectedBusId === id}
                    />
                ))}

                {userLocation && <UserMarker position={userLocation} />}
                
                {allRoutePoints.length > 0 && !selectedBusId && <FitBounds points={allRoutePoints} deps={[recenterKey, selectedRouteId]}/>}

                {isPathLoading && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card p-2 rounded-md shadow-lg text-sm font-medium">
                        Drawing route...
                    </div>
                )}
                
                {selectedRoute && !showFullPath && pathSegments && (
                    <>
                        <Polyline path={pathSegments.before} strokeColor="darkgray" strokeOpacity={0.6} strokeWeight={5} />
                        <Polyline path={pathSegments.between} strokeColor="lightgreen" strokeOpacity={0.8} strokeWeight={8} />
                        <Polyline path={pathSegments.after} strokeColor="darkgray" strokeOpacity={0.6} strokeWeight={5} />
                    </>
                )}

                {selectedRoute && showFullPath && routePath && (
                     <Polyline path={routePath} strokeColor="darkgreen" strokeOpacity={0.7} strokeWeight={6} />
                )}

                {busNavPath && (
                    <Polyline path={busNavPath} strokeColor="#4285F4" strokeOpacity={0.9} strokeWeight={8} />
                )}

                {selectedRoute?.stops.map((stop, index) => (
                    <StopMarker 
                        key={`stop-${index}-${stop.name}`} 
                        position={stop.position} 
                        stopName={stop.name} 
                        isSourceOrDest={stop.name === sourceStop || stop.name === destinationStop}
                    />
                ))}
                </Map>
            </APIProvider>
            ) : (
            <MissingApiKey />
            )}

            <BusDetailsSheet 
                busId={selectedBusId}
                busRoute={selectedBusRoute}
                onOpenChange={(open) => { if (!open) setSelectedBusId(null) }}
            />
        </div>

        {selectedRoute && (
            <div className="shrink-0 border-t bg-card">
                <button 
                    onClick={() => setIsPanelOpen(!isPanelOpen)}
                    className="w-full p-2 flex items-center justify-center text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                    {isPanelOpen ? (
                        <>
                            <ChevronDown className="mr-2 h-4 w-4" /> Hide Details
                        </>
                    ) : (
                        <>
                            <ChevronUp className="mr-2 h-4 w-4" /> View Details
                        </>
                    )}
                </button>
                {isPanelOpen && (
                    <div className="h-[40vh] flex flex-col">
                        <div className="p-4 border-b">
                          <div className='flex justify-between items-center mb-4'>
                              <h2 className="text-2xl font-bold">{selectedRoute.name}</h2>
                              {sourceStop && destinationStop && (
                              <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowFullPath(!showFullPath)}
                              >
                                  {showFullPath ? 'Show Journey' : 'Show Full Path'}
                              </Button>
                              )}
                          </div>
                          <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-muted-foreground">Buses on this route</h3>
                              <div className="flex flex-wrap gap-2">
                                  {selectedRoute.buses.map(busId => {
                                      const isOnline = !!allBuses[busId];
                                      return (
                                          <Badge key={busId} variant={isOnline ? 'default' : 'secondary'} className="gap-2">
                                              {isOnline ? <Wifi className="h-3 w-3 text-green-400" /> : <WifiOff className="h-3 w-3" />}
                                              {busId}
                                              <span className='font-normal opacity-80'>{isOnline ? 'Online' : 'Offline'}</span>
                                          </Badge>
                                      );
                                  })}
                              </div>
                          </div>
                        </div>

                        <ScrollArea className="flex-grow">
                            <div className="p-6 pt-4 space-y-6">
                                {journeyStops.map((stop, index) => (
                                    <div key={stop.name} className="space-y-3">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center">
                                                <PersonStanding className="h-6 w-6 text-primary" />
                                                {index < journeyStops.length - 1 && (
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

export default Page;

    
    

    
