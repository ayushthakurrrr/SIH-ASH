"use client";

import React, { useEffect, useState } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface PolylineProps {
    path: google.maps.LatLngLiteral[];
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
}

const Polyline: React.FC<PolylineProps> = (props) => {
    const map = useMap();
    const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);
    
    useEffect(() => {
        if (!map) return;

        if (!polyline) {
            setPolyline(new google.maps.Polyline(props));
        }

        return () => {
            if (polyline) {
                polyline.setMap(null);
            }
        };
    }, [map, polyline, props]);

    useEffect(() => {
        if (polyline) {
            polyline.setOptions(props);
            polyline.setMap(map);
        }
    }, [polyline, props, map]);

    return null;
}

export default Polyline;
