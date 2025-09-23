"use client";

import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useMap } from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StopMarkerProps {
  position: google.maps.LatLngLiteral;
  stopName: string;
}

const StopMarker: React.FC<StopMarkerProps> = ({ position, stopName }) => {
  const map = useMap();
  const [marker, setMarker] = useState<google.maps.marker.AdvancedMarkerElement | null>(null);

  useEffect(() => {
    if (!map) return;

    const markerElement = document.createElement('div');
    const root = createRoot(markerElement);
    
    root.render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-110">
              <MapPin className="h-6 w-6 text-destructive" fill="hsl(var(--destructive-foreground))" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">{stopName}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const newMarker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position,
        content: markerElement,
        title: stopName
    });

    setMarker(newMarker);

    return () => {
      newMarker.map = null;
      root.unmount();
    };
  }, [map, position, stopName]);

  useEffect(() => {
    if (marker) {
      marker.position = position;
    }
  }, [marker, position]);

  return null;
};

export default StopMarker;
