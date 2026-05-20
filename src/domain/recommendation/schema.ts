import { z } from 'zod';

export const rawTourSpotSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['view', 'walk', 'rest', 'cafe', 'barrierFree', 'officialCourse']),
  address: z.string(),
  area: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  imageUrl: z.string().url(),
  summary: z.string(),
  sourceLabel: z.string(),
  officialTags: z.array(z.string()),
  stayMinutes: z.number().int().positive(),
  walkingMinutes: z.number().int().nonnegative(),
  parking: z.boolean(),
  barrierFree: z.boolean(),
  kidFriendly: z.boolean(),
  indoor: z.boolean(),
  weatherFit: z.array(z.enum(['any', 'sunny', 'rain'])),
  openNow: z.boolean(),
  navKeyword: z.string(),
});

export const rawTourSpotListSchema = z.array(rawTourSpotSchema);

export type RawTourSpot = z.infer<typeof rawTourSpotSchema>;
