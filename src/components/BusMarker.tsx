"use client";

import type { FC } from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { Bus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BusMarkerProps {
  position: { lat: number; lng: number };
  busId: string;
}

const BusMarker: FC<BusMarkerProps> = ({ position, busId }) => {
  return (
    <AdvancedMarker position={position}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center cursor-pointer shadow-lg ring-4 ring-white/50 dark:ring-black/50 transition-transform duration-300 hover:scale-110">
              <Bus className="h-6 w-6 text-accent-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">{busId}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </AdvancedMarker>
  );
};

export default BusMarker;
