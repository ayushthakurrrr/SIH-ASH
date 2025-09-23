/**
 * @fileoverview Shared Zod schemas and TypeScript types for AI flows.
 */

import { z } from 'zod';

export const LocationSchema = z.object({
  lat: z.number().describe('The latitude.'),
  lng: z.number().describe('The longitude.'),
});

// Schemas for get-eta-flow
export const GetEtaInputSchema = z.object({
  origin: LocationSchema,
  destination: LocationSchema,
});
export type GetEtaInput = z.infer<typeof GetEtaInputSchema>;

export const GetEtaOutputSchema = z.object({
  duration: z.number().describe('The travel time in seconds.'),
  distance: z.number().describe('The travel distance in meters.'),
});
export type GetEtaOutput = z.infer<typeof GetEtaOutputSchema>;

// Schemas for get-route-path-flow
export const GetRoutePathInputSchema = z.object({
  stops: z.array(LocationSchema).describe('An array of stops, each with lat and lng.'),
});
export type GetRoutePathInput = z.infer<typeof GetRoutePathInputSchema>;

export const GetRoutePathOutputSchema = z.object({
  path: z.array(LocationSchema).describe('An array of points that form the polyline for the route.'),
});
export type GetRoutePathOutput = z.infer<typeof GetRoutePathOutputSchema>;
