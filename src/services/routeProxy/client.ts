import type { RecommendationInput, TravelSpot } from '@/domain/recommendation/types';
import type { CandidateRoutePlan } from '@/domain/routing/types';

const routeProxyUrl = process.env.EXPO_PUBLIC_ZATURI_ROUTE_PROXY_URL?.trim();

export type PlaceSearchRole = 'origin' | 'destination';

export type PlaceSearchResult = {
  id: string;
  name: string;
  address: string;
  area: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  source: 'tourApi' | 'vworld';
  sourceLabel: string;
  categoryLabel: string;
  description: string;
};

export type PlaceSearchResponse = {
  query: string;
  role: PlaceSearchRole;
  providers: {
    tourApi: boolean;
    vworld: boolean;
  };
  results: PlaceSearchResult[];
};

function buildUrl(pathname: string) {
  if (!routeProxyUrl) return null;

  return `${routeProxyUrl.replace(/\/$/, '')}${pathname}`;
}

export async function getRouteProxyCandidatePlan(
  input: RecommendationInput,
  candidates: TravelSpot[],
): Promise<CandidateRoutePlan | null> {
  const url = buildUrl('/api/routes/candidates');

  if (!url) return null;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      origin: {
        name: input.originName,
        coordinate: input.originCoordinate,
      },
      destination: {
        name: input.destinationName,
        coordinate: input.destinationCoordinate,
      },
      spots: candidates,
      preferTourApi: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Route proxy request failed: ${response.status} ${text}`);
  }

  return (await response.json()) as CandidateRoutePlan;
}

export async function searchRouteProxyPlaces(query: string, role: PlaceSearchRole): Promise<PlaceSearchResponse | null> {
  const url = buildUrl(`/api/places/search?query=${encodeURIComponent(query)}&role=${role}`);

  if (!url) return null;

  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Place search request failed: ${response.status} ${text}`);
  }

  return (await response.json()) as PlaceSearchResponse;
}
