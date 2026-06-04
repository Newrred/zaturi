# Route Recommendation Flow

Last updated: 2026-06-04

## Current MVP Flow

The app now treats a recommendation as a route bundle, not just a spot card.

1. User searches for an origin and selects a concrete coordinate result.
2. User searches for a destination and selects a concrete coordinate result.
3. The app builds a baseline driving route.
4. Candidate spots are compared against that baseline route.
5. Each recommendation shows a waypoint route:
   - origin -> spot -> destination
   - baseline drive time
   - waypoint drive time
   - added driving minutes
   - a mini route comparison drawing for baseline vs waypoint route shape
   - spare-time usage including stay and stop buffer

## Current Implementation

The implemented route layer is in `src/domain/routing/kakaoRoutePlanner.ts`.

It first tries the local route proxy when `EXPO_PUBLIC_ZATURI_ROUTE_PROXY_URL` is set. If the proxy is unavailable or has no Kakao REST API key, it falls back to a Kakao API-shaped mock planner. This keeps the product flow testable without exposing secrets in the Expo client.

The recommendation layer is in `src/domain/recommendation/recommend.ts`.

It calls the route planner first, then scores each spot with:

- added driving time
- distance from the baseline route corridor
- stay time and stop buffer
- parking
- walking burden
- accessibility
- weather fit
- companion fit

## Target Kakao Integration

For production or a real-data demo, keep the Kakao REST API key on a server-side proxy.

Recommended proxy responsibilities:

- Geocode origin/destination text using Kakao Local API.
- Call Kakao Mobility `GET /v1/directions` for the baseline route.
- Filter many candidate spots locally by distance from the returned route polyline.
- Call Kakao Mobility waypoint directions for only the closest candidate spots.
- Return only normalized route summaries to the Expo app.

The Expo app should call the proxy through `EXPO_PUBLIC_ZATURI_ROUTE_PROXY_URL`, not call Kakao directly with a REST key.

The local proxy lives at `server/kakao-proxy.mjs` and is documented in `docs/KAKAO_PROXY.md`.

Place search now starts at `GET /api/places/search?query=...&role=origin|destination`.

Current provider order:

- TourAPI `searchKeyword2` for tourism-oriented place search.
- VWorld address geocoding when `VWORLD_API_KEY` is configured.
- Kakao Local endpoints remain available in the proxy but are not the MVP's default search path because that service may require separate Kakao Map/Local activation.

The proxy intentionally avoids using Kakao's multi-origin/multi-destination APIs as the main long-distance candidate evaluator because those APIs require a search radius and can reject far-away travel candidates. The current strategy is baseline route once, local corridor filtering, then bounded waypoint calls.

TourAPI candidate fetching is documented in `docs/TOUR_API_INTEGRATION.md`.

## Visual Route Comparison

Recommendation cards now render `RouteMiniMap`, a lightweight SVG visualization that does not require a map tile API.

- Baseline route: dashed green line.
- Waypoint route: solid orange line.
- Origin, recommended spot, and destination are plotted from coordinates.
- Live proxy responses include both baseline route polylines and waypoint route polylines when Kakao Mobility route responses are available.
- Mock fallback responses still draw a simplified origin -> spot -> destination path.

This view is meant to help a tester judge "how different is this route bundle from my original route?" without opening a full map SDK.

## Spot Map Preview

Spot detail now uses platform-specific map previews for the selected spot coordinate.

- Android renders Kakao Maps Native SDK through `modules/zaturi-kakao-map` when `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY` is set.
- Android falls back to the OSM WebView preview when the native key is missing.
- iOS still uses the OSM WebView preview until a Kakao iOS bridge is added.
- Web renders an OSM iframe.
- This is still a single-pin spot preview, not the final full-map route planning surface.

## UX Direction

Keep the user-facing promise concrete:

- "추가 운전 약 8분"
- "기본 165분 -> 경유 173분"
- "경로선 약 3.2km"
- "체류 40분"

This is more useful than a vague recommendation score because the product's core value is whether a stopover is realistic inside the user's actual drive.
