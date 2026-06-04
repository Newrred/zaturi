import { getDistance } from 'geolib';

import type { RecommendationInput, TravelSpot, Coordinate } from '@/domain/recommendation/types';
import type { CandidateRoutePlan, RouteConfidence, RouteSummary, SpotRouteAssessment } from '@/domain/routing/types';
import { getRouteProxyCandidatePlan } from '@/services/routeProxy/client';

const metersPerDegreeLat = 111_320;
const routeDistanceFactor = 1.06;
const localRoadFactor = 1.18;
const drivingMetersPerMinute = 930;

const kakaoMockSourceLabel = '카카오 길찾기 API 구조 Mock';

const routeCorridors: Record<string, Coordinate[]> = {
  gangneung: [
    { latitude: 37.545, longitude: 127.205 },
    { latitude: 37.705, longitude: 127.88 },
    { latitude: 37.675, longitude: 128.705 },
  ],
  sokcho: [
    { latitude: 37.545, longitude: 127.205 },
    { latitude: 37.755, longitude: 127.88 },
    { latitude: 38.04, longitude: 128.17 },
    { latitude: 38.075, longitude: 128.62 },
  ],
  yangyang: [
    { latitude: 37.545, longitude: 127.205 },
    { latitude: 37.755, longitude: 127.88 },
    { latitude: 38.04, longitude: 128.17 },
    { latitude: 38.075, longitude: 128.62 },
  ],
  pyeongchang: [
    { latitude: 37.49, longitude: 127.98 },
    { latitude: 37.49, longitude: 128.16 },
    { latitude: 37.37, longitude: 128.39 },
  ],
};

function routeId(...parts: string[]) {
  return parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function toXY(point: Coordinate, reference: Coordinate) {
  const latRadians = (reference.latitude * Math.PI) / 180;

  return {
    x: (point.longitude - reference.longitude) * metersPerDegreeLat * Math.cos(latRadians),
    y: (point.latitude - reference.latitude) * metersPerDegreeLat,
  };
}

function distanceToSegmentMeters(point: Coordinate, start: Coordinate, end: Coordinate) {
  const reference = {
    latitude: (start.latitude + end.latitude) / 2,
    longitude: (start.longitude + end.longitude) / 2,
  };
  const p = toXY(point, reference);
  const a = toXY(start, reference);
  const b = toXY(end, reference);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(p.x - a.x, p.y - a.y);
  }

  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared));
  const projection = {
    x: a.x + t * dx,
    y: a.y + t * dy,
  };

  return Math.hypot(p.x - projection.x, p.y - projection.y);
}

function distanceToPolylineMeters(point: Coordinate, polyline: Coordinate[]) {
  if (polyline.length < 2) {
    return getDistance(point, polyline[0] ?? point);
  }

  let shortest = Number.POSITIVE_INFINITY;

  for (let index = 0; index < polyline.length - 1; index += 1) {
    shortest = Math.min(shortest, distanceToSegmentMeters(point, polyline[index], polyline[index + 1]));
  }

  return shortest;
}

function distanceAlongPolylineMeters(polyline: Coordinate[]) {
  let distance = 0;

  for (let index = 0; index < polyline.length - 1; index += 1) {
    distance += getDistance(polyline[index], polyline[index + 1]);
  }

  return Math.round(distance * routeDistanceFactor);
}

function estimateDrivingMinutes(distanceMeters: number) {
  const cityBuffer = distanceMeters < 25_000 ? 5 : 10;

  return Math.max(3, Math.ceil(distanceMeters / drivingMetersPerMinute) + cityBuffer);
}

function estimatePointToPointRoute(from: Coordinate, to: Coordinate) {
  const directDistance = getDistance(from, to);
  const distanceMeters = Math.round(directDistance * localRoadFactor);

  return {
    distanceMeters,
    durationMinutes: estimateDrivingMinutes(distanceMeters),
  };
}

function getRoutePolyline(input: RecommendationInput) {
  const corridor = routeCorridors[input.destinationId] ?? [];

  return [input.originCoordinate, ...corridor, input.destinationCoordinate];
}

function confidenceForDistance(distanceMeters: number): RouteConfidence {
  if (distanceMeters <= 6_000) return 'high';
  if (distanceMeters <= 18_000) return 'medium';
  return 'low';
}

function detourAccessPenaltyMinutes(distanceMeters: number) {
  if (distanceMeters <= 2_500) return 3;

  return Math.ceil(distanceMeters / 4_500);
}

function createBaselineRoute(input: RecommendationInput): RouteSummary {
  const polyline = getRoutePolyline(input);
  const distanceMeters = distanceAlongPolylineMeters(polyline);

  return {
    id: routeId(input.originName, input.destinationName, 'base'),
    originName: input.originName,
    destinationName: input.destinationName,
    distanceMeters,
    durationMinutes: estimateDrivingMinutes(distanceMeters),
    polyline,
    tollFare: Math.round(distanceMeters / 10_000) * 500,
    trafficLabel: '현재 교통 기준',
    providerMode: 'mockKakao',
    sourceLabel: kakaoMockSourceLabel,
  };
}

function assessSpotRoute(input: RecommendationInput, baselineRoute: RouteSummary, spot: TravelSpot): SpotRouteAssessment {
  const routeCorridorDistanceMeters = Math.round(distanceToPolylineMeters(spot.coordinate, baselineRoute.polyline));
  const toSpot = estimatePointToPointRoute(input.originCoordinate, spot.coordinate);
  const fromSpot = estimatePointToPointRoute(spot.coordinate, input.destinationCoordinate);
  const waypointDurationMinutes = toSpot.durationMinutes + fromSpot.durationMinutes;
  const waypointDistanceMeters = toSpot.distanceMeters + fromSpot.distanceMeters;
  const addedDriveMinutes = Math.max(
    detourAccessPenaltyMinutes(routeCorridorDistanceMeters),
    waypointDurationMinutes - baselineRoute.durationMinutes,
  );
  const addedDistanceMeters = Math.max(0, waypointDistanceMeters - baselineRoute.distanceMeters);

  return {
    spotId: spot.id,
    routeCorridorDistanceMeters,
    driveToSpotMinutes: toSpot.durationMinutes,
    driveFromSpotMinutes: fromSpot.durationMinutes,
    waypointDurationMinutes: baselineRoute.durationMinutes + addedDriveMinutes,
    waypointDistanceMeters: baselineRoute.distanceMeters + addedDistanceMeters,
    waypointPolyline: [input.originCoordinate, spot.coordinate, input.destinationCoordinate],
    addedDriveMinutes,
    addedDistanceMeters,
    confidence: confidenceForDistance(routeCorridorDistanceMeters),
    sourceLabel: kakaoMockSourceLabel,
  };
}

export async function getKakaoCandidateRoutePlan(input: RecommendationInput, candidates: TravelSpot[]): Promise<CandidateRoutePlan> {
  try {
    const proxyPlan = await getRouteProxyCandidatePlan(input, candidates);

    if (proxyPlan) {
      return proxyPlan;
    }
  } catch {
    // Keep the MVP usable when the local proxy is offline or the Kakao key is not configured.
  }

  await new Promise((resolve) => setTimeout(resolve, 220));

  const baselineRoute = createBaselineRoute(input);

  return {
    providerLabel: kakaoMockSourceLabel,
    isLive: false,
    baselineRoute,
    assessments: candidates.map((spot) => assessSpotRoute(input, baselineRoute, spot)),
  };
}

export function buildWaypointRouteSummary(input: RecommendationInput, spot: TravelSpot, assessment: SpotRouteAssessment): RouteSummary {
  return {
    id: routeId(input.originName, spot.name, input.destinationName),
    originName: input.originName,
    destinationName: `${spot.name} 경유 → ${input.destinationName}`,
    distanceMeters: assessment.waypointDistanceMeters,
    durationMinutes: assessment.waypointDurationMinutes,
    polyline: assessment.waypointPolyline ?? [input.originCoordinate, spot.coordinate, input.destinationCoordinate],
    tollFare: Math.round(assessment.waypointDistanceMeters / 10_000) * 500,
    trafficLabel: '현재 교통 기준',
    providerMode: 'mockKakao',
    sourceLabel: assessment.sourceLabel,
  };
}
