'use server';
/**
 * @fileoverview A flow for calculating the estimated time of arrival (ETA) between two points.
 *
 * This file defines a Genkit flow that uses the Google Maps Directions API to calculate
 * the travel time and distance between an origin and a destination.
 *
 * - getEta - A function that calculates the ETA.
 */

import { ai } from '@/ai/genkit';
import { GetEtaInputSchema, GetEtaOutputSchema, type GetEtaInput, type GetEtaOutput } from '@/ai/schemas';
import { z } from 'zod';

// Helper function to decode polyline, based on Google's documentation.
function decodePolyline(encoded: string): { lat: number; lng: number }[] {
    let points: { lat: number; lng: number }[] = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        points.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    return points;
}


const getDirectionsTool = ai.defineTool(
  {
    name: 'getDirections',
    description: 'Get directions between two locations.',
    inputSchema: GetEtaInputSchema,
    outputSchema: z.object({
        routes: z.array(z.object({
            overview_polyline: z.object({
                points: z.string()
            }),
            legs: z.array(z.object({
                duration: z.object({
                    value: z.number()
                }),
                distance: z.object({
                    value: z.number()
                })
            }))
        }))
    })
  },
  async ({ origin, destination }) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured.');
    }
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch directions: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
        throw new Error(`Directions API error: ${data.status} - ${data.error_message || 'No routes found.'}`);
    }
    return data;
  }
);


const getEtaFlow = ai.defineFlow(
  {
    name: 'getEtaFlow',
    inputSchema: GetEtaInputSchema,
    outputSchema: GetEtaOutputSchema,
  },
  async (input) => {
    const directions = await getDirectionsTool(input);

    const route = directions.routes[0];
    const leg = route?.legs[0];
    if (!leg || !route) {
        throw new Error("Could not determine ETA from directions response.");
    }
    
    const encodedPolyline = route.overview_polyline.points;
    const decodedPath = decodePolyline(encodedPolyline);
    
    return {
      duration: leg.duration.value,
      distance: leg.distance.value,
      path: decodedPath,
    };
  }
);

export async function getEta(input: GetEtaInput): Promise<GetEtaOutput> {
  return getEtaFlow(input);
}
