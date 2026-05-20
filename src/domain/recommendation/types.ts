import type { RouteBundlePlan, RouteSummary } from '@/domain/routing/types';

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type CompanionType = 'solo' | 'couple' | 'family' | 'senior';

export type WeatherPreference = 'any' | 'sunny' | 'rain';

export type SpotCategory =
  | 'view'
  | 'walk'
  | 'rest'
  | 'cafe'
  | 'barrierFree'
  | 'officialCourse';

export type TravelSpot = {
  id: string;
  name: string;
  category: SpotCategory;
  address: string;
  area: string;
  coordinate: Coordinate;
  imageUrl: string;
  summary: string;
  sourceLabel: string;
  officialTags: string[];
  stayMinutes: number;
  walkingMinutes: number;
  parking: boolean;
  barrierFree: boolean;
  kidFriendly: boolean;
  indoor: boolean;
  weatherFit: WeatherPreference[];
  openNow: boolean;
  navKeyword: string;
  candidateMeta?: {
    source: 'tourApi' | 'mock';
    contentTypeId?: string;
    priority: number;
    excluded?: boolean;
    reasons: string[];
  };
};

export type RecommendationInput = {
  originName: string;
  destinationId: string;
  destinationName: string;
  destinationCoordinate: Coordinate;
  originCoordinate: Coordinate;
  spareMinutes: number;
  companion: CompanionType;
  weather: WeatherPreference;
  needsBarrierFree: boolean;
  prefersLowWalking: boolean;
};

export type RecommendationBundle = {
  id: string;
  title: string;
  subtitle: string;
  spots: TravelSpot[];
  totalMinutes: number;
  detourMinutes: number;
  score: number;
  reasons: string[];
  routeFitLabel: string;
  routePlan: RouteBundlePlan;
};

export type RecommendationResult = {
  providerLabel: string;
  isLive: boolean;
  baselineRoute: RouteSummary;
  bundles: RecommendationBundle[];
};

export type DestinationPreset = {
  id: string;
  name: string;
  description: string;
  coordinate: Coordinate;
};
