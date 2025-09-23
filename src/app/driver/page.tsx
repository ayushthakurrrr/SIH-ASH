"use client";

import { useState, useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, StopCircle, Bus, MapPin, AlertTriangle, Wifi } from 'lucide-react';

export default function DriverPage() {
  const [busId, setBusId] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState('Disconnected');
  const [error, setError] = useState<string | null>(null);

  const socket = useRef<Socket | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    const storedBusId = localStorage.getItem('liveTrackBusId');
    if (storedBusId) {
      setBusId(storedBusId);
    }

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
  }, []);
  
  const handleBusIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBusId = e.target.value;
    setBusId(newBusId);
    localStorage.setItem('liveTrackBusId', newBusId);
  }

  const startTracking = () => {
    if (!busId) {
      setError('Please enter a Bus ID.');
      return;
    }
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(newLocation);
        socket.current?.emit('updateLocation', { busId, location: newLocation });
        setIsTracking(true);
        setStatus('Broadcasting Location');
      },
      (geoError) => {
        setError(`Geolocation error: ${geoError.message}`);
        setIsTracking(false);
        setStatus('Location Error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const stopTracking = () => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
    setLocation(null);
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
    if (status.includes('Error') || error) return 'destructive';
    if (status.includes('Broadcasting')) return 'default';
    return 'secondary';
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Bus className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold">Driver Panel</CardTitle>
          </div>
          <CardDescription>
            Enter your bus ID and start sharing your location.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="busId">Bus ID</Label>
            <Input
              id="busId"
              placeholder="e.g., Bus-42"
              value={busId}
              onChange={handleBusIdChange}
              disabled={isTracking}
            />
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

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive-foreground bg-destructive p-3 rounded-md">
                <AlertTriangle className="h-4 w-4" />
                <p>{error}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleToggleTracking}
            className="w-full transition-all duration-300"
            variant={isTracking ? 'destructive' : 'default'}
            size="lg"
            disabled={!busId}
          >
            {isTracking ? (
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
    </main>
  );
}
