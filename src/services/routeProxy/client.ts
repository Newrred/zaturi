import type { RecommendationInput, TravelSpot } from '@/domain/recommendation/types';
import type { CandidateRoutePlan } from '@/domain/routing/types';

const routeProxyUrl = process.env.EXPO_PUBLIC_ZATURI_ROUTE_PROXY_URL?.trim();

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
