import type { Coordinate, TravelSpot } from '@/domain/recommendation/types';

export type RouteProviderMode = 'mockKakao' | 'kakaoProxy';

export type RouteConfidence = 'high' | 'medium' | 'low';

export type RouteSummary = {
  id: string;
  originName: string;
  destinationName: string;
  distanceMeters: number;
  durationMinutes: number;
  polyline: Coordinate[];
  tollFare: number;
  trafficLabel: string;
  providerMode: RouteProviderMode;
  sourceLabel: string;
};

export type SpotRouteAssessment = {
  spotId: string;
  routeCorridorDistanceMeters: number;
  driveToSpotMinutes: number;
  driveFromSpotMinutes: number;
  waypointDurationMinutes: number;
  waypointDistanceMeters: number;
  addedDriveMinutes: number;
  addedDistanceMeters: number;
  confidence: RouteConfidence;
  sourceLabel: string;
};

export type RouteBundlePlan = {
  providerLabel: string;
  isLive: boolean;
  baselineRoute: RouteSummary;
  waypointRoute: RouteSummary;
  assessment: SpotRouteAssessment;
};

export type CandidateRoutePlan = {
  providerLabel: string;
  isLive: boolean;
  baselineRoute: RouteSummary;
  spots?: TravelSpot[];
  assessments: SpotRouteAssessment[];
};
