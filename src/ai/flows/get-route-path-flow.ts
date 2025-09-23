'use server';
/**
 * @fileoverview A flow for fetching a road-snapped route path from the Google Maps Directions API.
 *
 * - getRoutePath - A function that calculates the path.
 * - GetRoutePathInput - The input type for the getRoutePath function.
 * - GetRoutePathOutput - The return type for the getRoutePath function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const LocationSchema = z.object({
  lat: z.number().describe('The latitude.'),
  lng: z.number().describe('The longitude.'),
});

export const GetRoutePathInputSchema = z.object({
  stops: z.array(LocationSchema).describe('An array of stops, each with lat and lng.'),
});
export type GetRoutePathInput = z.infer<typeof GetRoutePathInputSchema>;

export const GetRoutePathOutputSchema = z.object({
  path: z.array(LocationSchema).describe('An array of points that form the polyline for the route.'),
});
export type GetRoutePathOutput = z.infer<typeof GetRoutePathOutputSchema>;

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


const getRoutePathFlow = ai.defineFlow(
  {
    name: 'getRoutePathFlow',
    inputSchema: GetRoutePathInputSchema,
    outputSchema: GetRoutePathOutputSchema,
  },
  async ({ stops }) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured.');
    }

    if (stops.length < 2) {
        throw new Error('At least two stops are required to generate a route path.');
    }

    const origin = `${stops[0].lat},${stops[0].lng}`;
    const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`;
    
    const waypoints = stops
      .slice(1, -1)
      .map(stop => `${stop.lat},${stop.lng}`)
      .join('|');

    let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}`;
    if (waypoints) {
        url += `&waypoints=${waypoints}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch directions: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
        throw new Error(`Directions API error: ${data.status} - ${data.error_message || 'No routes found.'}`);
    }

    const encodedPolyline = data.routes[0].overview_polyline.points;
    const decodedPath = decodePolyline(encodedPolyline);

    return {
      path: decodedPath,
    };
  }
);

export async function getRoutePath(input: GetRoutePathInput): Promise<GetRoutePathOutput> {
  return getRoutePathFlow(input);
}
