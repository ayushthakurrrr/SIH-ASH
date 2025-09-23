"use client";

import type { FC } from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StopMarkerProps {
  position: { lat: number; lng: number };
  stopName: string;
  isSourceOrDest?: boolean;
}

const StopMarker: FC<StopMarkerProps> = ({ position, stopName, isSourceOrDest }) => {
  const pinColor = isSourceOrDest ? "text-green-600" : "text-destructive";
  const pinFill = isSourceOrDest ? "hsl(140 80% 95%)" : "hsl(var(--destructive-foreground))";

  return (
    <AdvancedMarker position={position} title={stopName}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-110">
              <MapPin className={`h-6 w-6 ${pinColor}`} fill={pinFill} />
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
