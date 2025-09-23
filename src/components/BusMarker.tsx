
"use client";

import type { FC } from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { Bus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BusMarkerProps {
  position: { lat: number; lng: number };
  busId: string;
  onClick?: () => void;
  color?: string;
  isSelected?: boolean;
}

const BusMarker: FC<BusMarkerProps> = ({ position, busId, onClick, color = 'hsl(var(--accent))', isSelected }) => {
  const ringClass = isSelected ? 'ring-4 ring-offset-2 ring-blue-500' : 'ring-4 ring-white/50 dark:ring-black/50';

  const handleClick = (e: any) => {
    // The google maps event object doesn't have stopPropagation, 
    // but calling our onClick without arguments is safe.
    onClick?.();
  };

  return (
    <AdvancedMarker position={position} onClick={handleClick}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all duration-300 hover:scale-110 ${ringClass}`}
              style={{ backgroundColor: color }}
            >
              <Bus className="h-6 w-6 text-white" />
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

    
