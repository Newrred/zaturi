import type { Coordinate } from '@/domain/recommendation/types';

import type { PlannerMapProps } from './PlannerMap.types';

export type PlannerMapRegion = Coordinate & {
  latitudeDelta: number;
  longitudeDelta: number;
};

const fallbackRegion: PlannerMapRegion = {
  latitude: 37.75,
  longitude: 128.2,
  latitudeDelta: 1.55,
  longitudeDelta: 2.1,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function isValidCoordinate(coordinate?: Coordinate | null): coordinate is Coordinate {
  return (
    Boolean(coordinate) &&
    Number.isFinite(coordinate?.latitude) &&
    Number.isFinite(coordinate?.longitude) &&
    Math.abs(coordinate?.latitude ?? 0) <= 90 &&
    Math.abs(coordinate?.longitude ?? 0) <= 180
  );
}

export function getPlannerMapPoints(props: Pick<
  PlannerMapProps,
  'baseCoordinate' | 'candidateMarkers' | 'destinationCoordinate' | 'originCoordinate'
>) {
  const points: Coordinate[] = [];

  if (isValidCoordinate(props.baseCoordinate)) points.push(props.baseCoordinate);
  if (isValidCoordinate(props.originCoordinate)) points.push(props.originCoordinate);
  if (isValidCoordinate(props.destinationCoordinate)) points.push(props.destinationCoordinate);

  for (const marker of props.candidateMarkers ?? []) {
    if (isValidCoordinate(marker.coordinate)) points.push(marker.coordinate);
  }

  return points;
}

export function getPlannerMapRegion(points: readonly Coordinate[]): PlannerMapRegion {
  if (points.length === 0) return fallbackRegion;

  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const latitudeSpan = maxLatitude - minLatitude;
  const longitudeSpan = maxLongitude - minLongitude;

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: clamp(latitudeSpan * 1.8, 0.08, 2.4),
    longitudeDelta: clamp(longitudeSpan * 1.8, 0.08, 2.8),
  };
}

export function projectCoordinate(coordinate: Coordinate, region: PlannerMapRegion) {
  const leftLongitude = region.longitude - region.longitudeDelta / 2;
  const topLatitude = region.latitude + region.latitudeDelta / 2;

  return {
    left: clamp(((coordinate.longitude - leftLongitude) / region.longitudeDelta) * 100, 4, 96),
    top: clamp(((topLatitude - coordinate.latitude) / region.latitudeDelta) * 100, 4, 96),
  };
}

export function coordinateKey(point: Coordinate) {
  return `${point.latitude.toFixed(5)},${point.longitude.toFixed(5)}`;
}

export function getPlannerMapAccessibilityLabel(props: PlannerMapProps) {
  if (props.accessibilityLabel) return props.accessibilityLabel;

  const candidateCount = props.candidateMarkers?.length ?? 0;
  const endpointParts = [
    isValidCoordinate(props.baseCoordinate) ? 'base' : null,
    isValidCoordinate(props.originCoordinate) ? 'origin' : null,
    isValidCoordinate(props.destinationCoordinate) ? 'destination' : null,
  ].filter(Boolean);

  return `Planner map showing ${endpointParts.join(', ') || 'Gangwon'} and ${candidateCount} candidate marker${
    candidateCount === 1 ? '' : 's'
  }.`;
}
