import type { Coordinate } from '@/domain/recommendation/types';

function fixedCoordinate(value: number) {
  return value.toFixed(6);
}

export function buildOpenStreetMapEmbedUrl(coordinate: Coordinate) {
  const latitudeDelta = 0.018;
  const longitudeDelta = 0.026;
  const left = fixedCoordinate(coordinate.longitude - longitudeDelta);
  const bottom = fixedCoordinate(coordinate.latitude - latitudeDelta);
  const right = fixedCoordinate(coordinate.longitude + longitudeDelta);
  const top = fixedCoordinate(coordinate.latitude + latitudeDelta);
  const latitude = fixedCoordinate(coordinate.latitude);
  const longitude = fixedCoordinate(coordinate.longitude);

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

export function buildOpenStreetMapViewUrl(coordinate: Coordinate) {
  return `https://www.openstreetmap.org/?mlat=${fixedCoordinate(coordinate.latitude)}&mlon=${fixedCoordinate(
    coordinate.longitude,
  )}#map=14/${fixedCoordinate(coordinate.latitude)}/${fixedCoordinate(coordinate.longitude)}`;
}
