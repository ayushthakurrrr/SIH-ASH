"use client";

import type { FC } from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StopMarkerProps {
  position: { lat: number; lng: number };
  stopName: string;
}

const StopMarker: FC<StopMarkerProps> = ({ position, stopName }) => {
  return (
    <AdvancedMarker position={position}>
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
    </AdvancedMarker>
  );
};

export default StopMarker;
