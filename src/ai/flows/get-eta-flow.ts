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


const getDirectionsTool = ai.defineTool(
  {
    name: 'getDirections',
    description: 'Get directions between two locations.',
    inputSchema: GetEtaInputSchema,
    outputSchema: z.object({
        routes: z.array(z.object({
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

    const leg = directions.routes[0]?.legs[0];
    if (!leg) {
        throw new Error("Could not determine ETA from directions response.");
    }
    
    return {
      duration: leg.duration.value,
      distance: leg.distance.value,
    };
  }
);

export async function getEta(input: GetEtaInput): Promise<GetEtaOutput> {
  return getEtaFlow(input);
}
