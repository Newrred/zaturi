import * as Linking from 'expo-linking';

import type { Coordinate, TravelSpot } from '@/domain/recommendation/types';

export function buildMapUrl(spot: TravelSpot) {
  const query = encodeURIComponent(`${spot.navKeyword} ${spot.address}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function coordinateParam(coordinate: Coordinate) {
  return `${coordinate.latitude},${coordinate.longitude}`;
}

export function buildWaypointDirectionsUrl({
  originCoordinate,
  destinationCoordinate,
  waypoint,
}: {
  originCoordinate: Coordinate;
  destinationCoordinate: Coordinate;
  waypoint: TravelSpot;
}) {
  const params = [
    ['api', '1'],
    ['origin', coordinateParam(originCoordinate)],
    ['destination', coordinateParam(destinationCoordinate)],
    ['waypoints', coordinateParam(waypoint.coordinate)],
    ['travelmode', 'driving'],
  ]
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  return `https://www.google.com/maps/dir/?${params}`;
}

export async function openNavigation(spot: TravelSpot) {
  const url = buildMapUrl(spot);
  const canOpen = await Linking.canOpenURL(url);

  if (canOpen) {
    await Linking.openURL(url);
  }
}

export async function openWaypointNavigation(input: {
  originCoordinate: Coordinate;
  destinationCoordinate: Coordinate;
  waypoint: TravelSpot;
}) {
  const url = buildWaypointDirectionsUrl(input);
  const canOpen = await Linking.canOpenURL(url);

  if (canOpen) {
    await Linking.openURL(url);
  }
}
