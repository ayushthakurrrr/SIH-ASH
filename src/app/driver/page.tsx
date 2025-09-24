
"use client";

import { useState, useEffect, useRef, useMemo, type FC, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, StopCircle, Bus, MapPin, AlertTriangle, Wifi, Route, Navigation, Flag, List, PanelTopClose, PanelTopOpen, LocateFixed, Loader2, Globe } from 'lucide-react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { getFirestore, collection, getDocs, doc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import type { BusRoute, City } from '@/lib/bus-routes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getRoutePath } from '@/ai/flows/get-route-path-flow';
import { getEta } from '@/ai/flows/get-eta-flow';
import BusMarker from '@/components/BusMarker';
import StopMarker from '@/components/StopMarker';
import Polyline from '@/components/Polyline';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type RoutePath = { lat: number; lng: number }[];

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

const FitBoundsToDriver: FC<{ driverLocation: { lat: number, lng: number } | null, nextStopLocation: { lat: number, lng: number } | null, recenterKey: number }> = ({ driverLocation, nextStopLocation, recenterKey }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !driverLocation) return;
        
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(driverLocation);
        if (nextStopLocation) {
            bounds.extend(nextStopLocation);
        }
        
        if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
             map.setCenter(driverLocation);
             map.setZoom(16);
        } else {
            map.fitBounds(bounds, {top: 100, bottom: 100, left: 100, right: 100});
        }
        
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, driverLocation, nextStopLocation, recenterKey]);

    return null;
}

const DriverNavigationLine: FC<{
    driverLocation: { lat: number; lng: number };
    nextStopLocation: { lat: number; lng: number };
}> = ({ driverLocation, nextStopLocation }) => {
    const [navPath, setNavPath] = useState<RoutePath | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchNavPath = async () => {
            if (!driverLocation || !nextStopLocation) return;
            try {
                const { path } = await getEta({
                    origin: driverLocation,
                    destination: nextStopLocation,
                });
                if(path) {
                    setNavPath(path);
                }
            } catch (error) {
                console.error("Error fetching navigation path:", error);
                toast({
                    variant: "destructive",
                    title: "Could not fetch navigation path",
                    description: "There was an error fetching the live navigation path.",
                });
            }
        };

        fetchNavPath();
        const intervalId = setInterval(fetchNavPath, 30000); // Refresh path every 30 seconds

        return () => clearInterval(intervalId);
    }, [driverLocation, nextStopLocation, toast]);

    if (!navPath) return null;

    return <Polyline path={navPath} strokeColor="#4285F4" strokeOpacity={0.8} strokeWeight={8} />;
};


const DriverMap: FC<{
    route: BusRoute;
    driverLocation: { lat: number; lng: number; };
    nextStopIndex: number;
    recenterKey: number;
    isAwayFromStart: boolean;
    pathToStart: RoutePath | null;
}> = ({ route, driverLocation, nextStopIndex, recenterKey, isAwayFromStart, pathToStart }) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const { toast } = useToast();
    const [routePath, setRoutePath] = useState<RoutePath | null>(null);
    const [isPathLoading, setIsPathLoading] = useState(false);

    useEffect(() => {
        const fetchPath = async () => {
            setIsPathLoading(true);
            try {
                const { path } = await getRoutePath({ stops: route.stops.map(s => s.position) });
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
    }, [route, toast]);

    if (!apiKey) {
        return <div className="flex items-center justify-center h-full bg-muted text-destructive text-center p-4">Google Maps API Key is missing.</div>
    }
    
    const nextStopLocation = (isAwayFromStart && route.stops.length > 0)
        ? route.stops[0].position
        : route.stops[nextStopIndex]?.position || null;

    return (
        <APIProvider apiKey={apiKey}>
            <Map
                defaultCenter={{ lat: 22.7196, lng: 75.8577 }}
                defaultZoom={12}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                mapId="driver-map"
            >
                {driverLocation && (
                    <>
                        <BusMarker position={driverLocation} busId="Your Location" />
                        <FitBoundsToDriver key={recenterKey} driverLocation={driverLocation} nextStopLocation={nextStopLocation} recenterKey={recenterKey} />
                        {isAwayFromStart && pathToStart ? (
                             <Polyline path={pathToStart} strokeColor="#F4B400" strokeOpacity={0.9} strokeWeight={8} />
                        ) : (
                            nextStopLocation && <DriverNavigationLine driverLocation={driverLocation} nextStopLocation={nextStopLocation} />
                        )}
                    </>
                )}
                {routePath && (
                     <Polyline path={routePath} strokeColor="darkgreen" strokeOpacity={0.7} strokeWeight={6} />
                )}
                {route.stops.map((stop, index) => (
                    <StopMarker 
                        key={`stop-${index}-${stop.name}`} 
                        position={stop.position} 
                        stopName={stop.name} 
                        isSourceOrDest={isAwayFromStart ? index === 0 : index === nextStopIndex}
                    />
                ))}
            </Map>
            {isPathLoading && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card p-2 rounded-md shadow-lg text-sm font-medium">
                    Drawing route...
                </div>
            )}
        </APIProvider>
    );
};


export default function DriverPage() {
  const [busId, setBusId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState('Disconnected');
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [busRoutes, setBusRoutes] = useState<BusRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [recenterKey, setRecenterKey] = useState(0);
  const [isAwayFromStart, setIsAwayFromStart] = useState(false);
  const [pathToStart, setPathToStart] = useState<RoutePath | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);


  const socket = useRef<Socket | null>(null);
  const watchId = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCities = async () => {
        try {
            const db = getFirestore(app);
            const citiesCollection = collection(db, 'cities');
            const citiesSnapshot = await getDocs(citiesCollection);
            const citiesList = citiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as City));
            setCities(citiesList);

            const storedCityId = localStorage.getItem('liveTrackCityId');
            if (storedCityId && citiesList.some(c => c.id === storedCityId)) {
                setSelectedCityId(storedCityId);
            }

        } catch (error) {
            console.error("Error fetching cities from Firestore:", error);
            setError("Could not load cities from database.");
        }
    };
    fetchCities();
  }, []);
  
  const handleCityIdChange = useCallback((cityId: string) => {
    setSelectedCityId(cityId);
    localStorage.setItem('liveTrackCityId', cityId);
    setSelectedRouteId(null);
    setBusId(null);
    localStorage.removeItem('liveTrackRouteId');
    localStorage.removeItem('liveTrackBusId');
  }, []);

  useEffect(() => {
    if (!selectedCityId) {
        setBusRoutes([]);
        return;
    }
    const fetchRoutes = async () => {
        try {
            const db = getFirestore(app);
            const cityRef = doc(db, 'cities', selectedCityId);
            const routesCollection = collection(cityRef, 'routes');
            const routesSnapshot = await getDocs(routesCollection);
            const routesList = routesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BusRoute));
            setBusRoutes(routesList);
            
            const storedRouteId = localStorage.getItem('liveTrackRouteId');
            if (storedRouteId && routesList.some(r => r.id === storedRouteId)) {
              setSelectedRouteId(storedRouteId);
              const route = routesList.find(r => r.id === storedRouteId);
              if (route) {
                const storedBusId = localStorage.getItem('liveTrackBusId');
                if (storedBusId && route.buses.includes(storedBusId)) {
                  setBusId(storedBusId);
                }
              }
            }

        } catch (error) {
            console.error(`Error fetching routes for ${selectedCityId}:`, error);
            setError(`Could not load routes for ${selectedCityId}.`);
        }
    };
    fetchRoutes();
  }, [selectedCityId]);


  useEffect(() => {
    const newSocket = io();
    socket.current = newSocket;

    newSocket.on('connect', () => setStatus('Connected'));
    newSocket.on('disconnect', () => {
      setStatus('Disconnected');
      stopTracking();
    });

    return () => {
      newSocket.disconnect();
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleBusIdChange = (newBusId: string) => {
    setBusId(newBusId);
    localStorage.setItem('liveTrackBusId', newBusId);
  }

  const handleRouteIdChange = (routeId: string) => {
    setSelectedRouteId(routeId);
    localStorage.setItem('liveTrackRouteId', routeId);
    setBusId(null); // Reset bus ID when route changes
    localStorage.removeItem('liveTrackBusId');
  }
  
  const selectedRoute = useMemo(() => 
    selectedRouteId ? busRoutes.find(r => r.id === selectedRouteId) : null,
    [selectedRouteId, busRoutes]
  );
  
  const availableBuses = useMemo(() => {
    if (!selectedRoute) return [];
    return selectedRoute.buses;
  }, [selectedRoute]);


  const startTracking = () => {
    if (!busId || !selectedRoute) {
      setError('Please select a city, route, and a bus ID.');
      return;
    }
    setError(null);
    setIsFetchingLocation(true);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setIsFetchingLocation(false);
      return;
    }

    // Check distance from start
    navigator.geolocation.getCurrentPosition(async (position) => {
        setIsFetchingLocation(false);
        const currentLoc = { lat: position.coords.latitude, lng: position.coords.longitude };
        const startStop = selectedRoute.stops[0];
        if (!startStop) {
            setError("Selected route has no stops defined.");
            return;
        }

        const distance = haversineDistance(currentLoc, startStop.position);
        if (distance > 200) { // 200 meters threshold
            setIsAwayFromStart(true);
            try {
                const { path } = await getEta({ origin: currentLoc, destination: startStop.position });
                if(path) {
                    setPathToStart(path);
                }
            } catch (e) {
                console.error("Failed to get path to start", e);
                toast({
                    variant: "destructive",
                    title: "Could not get directions",
                    description: "Failed to calculate path to the route's starting point."
                });
            }
        } else {
            setIsAwayFromStart(false);
            setPathToStart(null);
        }

        // Now, start continuous tracking
        setIsTracking(true);
        watchId.current = navigator.geolocation.watchPosition(
          (pos) => {
            const newLocation = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
            setLocation(newLocation);
             if (isAwayFromStart) {
                const distToStart = haversineDistance(newLocation, startStop.position);
                if (distToStart <= 200) {
                    setIsAwayFromStart(false);
                    setPathToStart(null);
                }
            }
            if (socket.current?.connected) {
              socket.current.emit('updateLocation', { busId, location: newLocation });
              setStatus('Broadcasting Location');
            }
          },
          (geoError) => {
            setError(`Geolocation error: ${geoError.message}`);
            stopTracking();
          },
          {
            enableHighAccuracy: true,
            maximumAge: 60000,
          }
        );
    }, (error) => {
        setError(`Could not get initial location: ${error.message}`);
        setIsFetchingLocation(false);
    });
  };

  const stopTracking = () => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
    setIsAwayFromStart(false);
    setPathToStart(null);
    setStatus(socket.current?.connected ? 'Connected' : 'Disconnected');
  };

  const handleToggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  const getStatusVariant = () => {
    if (error) return 'destructive';
    if (status.includes('Broadcasting')) return 'default';
    return 'secondary';
  }
  
  const nextStopIndex = useMemo(() => {
    if (!location || !selectedRoute) return 0;

    let closestStopIndex = -1;
    let minDistance = Infinity;

    // Find the stop the driver is physically closest to
    selectedRoute.stops.forEach((stop, index) => {
        const distance = haversineDistance(location, stop.position);
        if (distance < minDistance) {
            minDistance = distance;
            closestStopIndex = index;
        }
    });
    
    if (closestStopIndex === -1) return 0;

    // If the driver is very close to a stop, the "next" stop is the one after it.
    if (minDistance < 200 && closestStopIndex < selectedRoute.stops.length - 1) { // 200 meters threshold
        return closestStopIndex + 1;
    }
    
    // Otherwise, find the next stop on the path
    // This is a simplified logic, a real app would need to check if a stop has been "visited"
    // and which direction the bus is heading.
    // For now, we'll assume the next unvisited stop is the target.
    // This just returns the closest as a placeholder.
    return closestStopIndex;

  }, [location, selectedRoute]);


  const nextStop = useMemo(() => {
      if (!selectedRoute || nextStopIndex === -1) return null;
      if (isAwayFromStart) return selectedRoute.stops[0];
      return selectedRoute.stops[nextStopIndex];
  }, [selectedRoute, nextStopIndex, isAwayFromStart]);

  return (
    <main className="flex flex-col md:flex-row h-screen bg-background text-foreground">
      <div className="w-full md:w-[400px] shrink-0 border-r flex flex-col">
        <Card className="w-full h-full shadow-none border-0 rounded-none flex flex-col">
            <CardHeader>
                <div className='flex justify-between items-center'>
                  <div className="flex items-center gap-3">
                    <Bus className="h-8 w-8 text-primary" />
                    <CardTitle className="text-3xl font-bold">Driver Panel</CardTitle>
                  </div>
                   <Button 
                        variant="ghost" 
                        size="icon" 
                        className="md:hidden" 
                        onClick={() => setIsPanelMinimized(!isPanelMinimized)}
                    >
                        {isPanelMinimized ? <PanelTopOpen className="h-5 w-5" /> : <PanelTopClose className="h-5 w-5" />}
                    </Button>
                </div>
              <CardDescription className="mt-2">
                Select your city and route, start tracking, and see your live navigation.
              </CardDescription>
            </CardHeader>

            <div className={`${isPanelMinimized ? 'hidden' : ''} md:block flex-grow`}>
              <CardContent className="space-y-6">
                 <div className="space-y-2">
                  <Label htmlFor="cityId">City</Label>
                  <Select onValueChange={handleCityIdChange} value={selectedCityId || ""} disabled={isTracking}>
                      <SelectTrigger id="cityId" className="w-full">
                          <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Select City" />
                      </SelectTrigger>
                      <SelectContent>
                          {cities.map((city) => (
                              <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="routeId">Route</Label>
                  <Select onValueChange={handleRouteIdChange} value={selectedRouteId || ""} disabled={isTracking || !selectedCityId}>
                      <SelectTrigger id="routeId" className="w-full">
                          <Route className="h-4 w-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Select Route" />
                      </SelectTrigger>
                      <SelectContent>
                          {busRoutes.map((route) => (
                              <SelectItem key={route.id} value={route.id}>{route.name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="busId">Bus ID</Label>
                  <Select onValueChange={handleBusIdChange} value={busId || ""} disabled={isTracking || !selectedRouteId}>
                      <SelectTrigger id="busId" className="w-full">
                          <Bus className="h-4 w-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Select Bus ID" />
                      </SelectTrigger>
                      <SelectContent>
                          {availableBuses.map((bus) => (
                              <SelectItem key={bus} value={bus}>{bus}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>
                
                <div className="p-4 rounded-lg bg-muted border space-y-3">
                  <div className='flex justify-between items-center'>
                      <h3 className="font-semibold text-muted-foreground">Status</h3>
                      <Badge variant={getStatusVariant()} className="flex items-center gap-2">
                          {isTracking ? <Wifi className="h-3 w-3 animate-pulse" /> : <Wifi className="h-3 w-3" />}
                          {status}
                      </Badge>
                  </div>

                  <div className='flex justify-between items-center text-sm'>
                      <h3 className="font-semibold text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> Location</h3>
                      <span className="font-mono text-foreground">
                          {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'N/A'}
                      </span>
                  </div>
                </div>

                {isAwayFromStart && selectedRoute && (
                     <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>You are far from the starting point!</AlertTitle>
                        <AlertDescription>
                            Please proceed to the first stop: <span className="font-semibold">{selectedRoute.stops[0].name}</span>. Navigation has been updated.
                        </AlertDescription>
                    </Alert>
                )}

              {isTracking && nextStop && (
                  <div className="p-4 rounded-lg bg-primary/10 border-2 border-dashed border-primary space-y-2">
                      <div className="flex items-center justify-between text-sm font-semibold text-primary">
                          <div className="flex items-center gap-2">
                            <Navigation className="h-4 w-4" />
                            {isAwayFromStart ? "Proceed to Start" : "Next Stop"}
                          </div>
                          <Button variant="outline" size="icon" className='h-7 w-7' onClick={() => setRecenterKey(k => k + 1)}>
                            <LocateFixed className='h-4 w-4'/>
                            <span className="sr-only">Recenter Map</span>
                          </Button>
                      </div>
                      <p className="text-2xl font-bold text-primary-foreground bg-primary rounded-md p-2 flex items-center justify-center gap-3 text-center">
                          <Flag className="h-6 w-6" />
                          {nextStop.name}
                      </p>
                      <p className="text-xs text-muted-foreground text-center">Scheduled for {nextStop.scheduledTime}</p>
                  </div>
              )}
              
              {selectedRoute && !isTracking && (
                  <Card>
                      <CardHeader className='p-4'>
                          <CardTitle className='text-lg flex items-center gap-2'>
                              <List className='h-5 w-5' />
                              Station List
                          </CardTitle>
                      </CardHeader>
                      <CardContent className='p-0'>
                          <ScrollArea className='h-48 px-4'>
                             <div className="space-y-4">
                                  {selectedRoute.stops.map((stop, index) => (
                                      <div key={stop.name} className="flex items-center gap-3">
                                          <div className="flex-shrink-0 bg-primary/20 text-primary font-bold rounded-full h-8 w-8 flex items-center justify-center text-sm">
                                              {index + 1}
                                          </div>
                                          <div>
                                              <p className="font-medium">{stop.name}</p>
                                              <p className="text-xs text-muted-foreground">Scheduled: {stop.scheduledTime}</p>
                                          </div>
                                      </div>
                                  ))}
                             </div>
                          </ScrollArea>
                      </CardContent>
                  </Card>
              )}


                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive-foreground bg-destructive p-3 rounded-md">
                      <AlertTriangle className="h-4 w-4" />
                      <p>{error}</p>
                  </div>
                )}
              </CardContent>
            </div>
            <CardFooter className="mt-auto">
              <Button
                onClick={handleToggleTracking}
                className="w-full transition-all duration-300"
                variant={isTracking ? 'destructive' : 'default'}
                size="lg"
                disabled={!busId || !selectedRouteId || isFetchingLocation}
              >
                {isFetchingLocation ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Fetching Location...
                    </>
                ) : isTracking ? (
                  <>
                    <StopCircle className="mr-2 h-5 w-5" /> Stop Tracking
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-5 w-5" /> Start Tracking
                  </>
                )}
              </Button>
            </CardFooter>
        </Card>
      </div>

      <div className="flex-grow h-full bg-muted">
        {isTracking && selectedRoute && location ? (
            <DriverMap 
                route={selectedRoute} 
                driverLocation={location}
                nextStopIndex={nextStopIndex}
                recenterKey={recenterKey}
                isAwayFromStart={isAwayFromStart}
                pathToStart={pathToStart}
            />
        ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                <MapPin size={48} className="text-muted-foreground" />
                <h3 className="text-xl font-semibold">Your Map Will Appear Here</h3>
                <p className="text-muted-foreground">Please select a city and route, then start tracking to see your live position.</p>
            </div>
        )}
      </div>

    </main>
  );
}
