# Development Structure

This document describes how the project should be organized as it grows. It is a guide, not a fixed contract.

## Current State

The project now uses Expo Router and a small MVP app structure:

```text
app/
  _layout.tsx
  index.tsx
  recommendations.tsx
  nearby.tsx
  spot/[id].tsx
  spot/new.tsx
  saved.tsx
  settings.tsx
src/
  components/
  constants/
  data/
  domain/
  store/
  types/
  utils/
app.json
eas.json
assets/
docs/
maestro/
  flows/
  live-flows/
server/
  kakao-proxy.mjs
  recommendation/
modules/
  zaturi-kakao-map/
work_logs/
tools/
```

## Target App Structure

As feature work continues, keep this structure clear:

```text
app/
  _layout.tsx
  index.tsx
  recommendations.tsx
  nearby.tsx
  spot/[id].tsx
  spot/new.tsx
  saved.tsx
  settings.tsx

src/
  components/
    planner/
      PlannerMap.native.tsx
      PlannerMap.android.tsx
      PlannerMap.web.tsx
      PlannerMap.shared.ts
      PlannerMap.types.ts
    RouteMiniMap.tsx
    TimeFitCard.tsx
    SpotMap.android.tsx
    SpotMap.native.tsx
    SpotMap.web.tsx
    recommendation/
    layout/
    form/
  constants/
    colors.ts
    spacing.ts
  data/
    destinations.ts
    mockSpots.ts
  domain/
    recommendation/
      types.ts
      schema.ts
      scoring.ts
      bundle.ts
      recommend.ts
      nearby.ts
      userSpots.ts
    routing/
      types.ts
      kakaoRoutePlanner.ts
  services/
    routeProxy/
      client.ts
    tourApi/
      client.ts
      mapper.ts
  hooks/
  utils/
    openStreetMap.ts
  types/
server/
  kakao-proxy.mjs
  recommendation/
    tour-candidate-policy.mjs
modules/
  zaturi-kakao-map/
```

The exact structure can change, but keep these boundaries clear:

- `app/`: route files and screen composition.
- `src/components/`: reusable UI pieces.
- `src/domain/`: product logic such as recommendation models and scoring.
- `src/services/`: external API clients and response mapping.
- `src/data/`: mock or seed data used for prototyping.
- `src/constants/`: colors, spacing, labels, and stable UI values.
- `src/utils/openStreetMap.ts`: free MVP map embed URL helpers for spot previews.
- `src/components/SpotMap.android.tsx`: Android spot map preview. Uses Kakao Maps Native SDK when `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY` is configured, otherwise falls back to OSM.
- `src/components/planner/PlannerMap.*`: fullscreen planner map used by the home screen. Android uses the local Kakao Maps native module when `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY` is configured, then falls back to OSM/WebView/static styling. Web uses Kakao Maps JavaScript SDK when `EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY` and a registered web origin are configured, then falls back to OSM/static styling. iOS currently uses OSM/WebView/static fallback until an iOS Kakao native bridge is added.
- `server/`: local backend proxy code for secret-bearing public API calls.
- `server/recommendation/`: server-side candidate selection policy that should stay separate from API plumbing.
- `modules/zaturi-kakao-map/`: local Expo native module that wraps Kakao Maps SDK for Android. Keep the JS prop surface provider-agnostic enough to add iOS later.
- `maestro/flows/`: deterministic emulator smoke flows that should not depend on live public API availability.
- `maestro/live-flows/`: network-dependent emulator flows for public proxy and real API behavior, such as live place search.

## Data Model Direction

Core model candidates:

- `TravelSpot`: a normalized tourism spot.
- `RecommendationInput`: current route, spare time, companion type, and filters.
- `RecommendationBundle`: one comparable waypoint route card, usually `origin -> spot -> destination`.
- `NearbyRecommendationInput`: current/base location, spare time, movement mode, companion type, and filters.
- `NearbyRecommendation`: one time-fit nearby option, usually `base location -> spot -> optional return/base`.
- `UserZaturiSpot`: a user-saved or manually added small spot that can be used as a recommendation candidate.
- `RouteSummary`: normalized baseline or waypoint route data.
- `SpotRouteAssessment`: added driving time, route corridor distance, and confidence for one candidate.
- `AccessibilityInfo`: parking, wheelchair access, stroller friendliness, walking burden.
- `WeatherContext`: simple weather condition used for filtering or explanation.

Do not let raw external API shapes leak into UI components. Map TourAPI, Kakao Mobility, or other public data into app-owned types first.

Kakao REST API keys must not be stored directly in the Expo client. Use `server/kakao-proxy.mjs` for local live Kakao Local and Kakao Mobility calls, then return normalized route models to the app.

Kakao Maps Native App Key may be exposed to the client build through `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY`, but it must be the native app key, not the REST API key. Register the Android package name and key hash in Kakao Developers before expecting the native map to authenticate.

Kakao Maps JavaScript Key may be exposed to the web build through `EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY`, but it must be the JavaScript key, not the native or REST key. Register the Expo web origin, such as `http://localhost:8090`, in Kakao Developers before expecting the web map to authenticate.

TourAPI raw items should not flow directly into screens. Route them through `server/recommendation/tour-candidate-policy.mjs`, then send app-owned `TravelSpot` data and policy reasons to the client.

## UI Direction

- Start with practical mobile screens rather than a marketing landing page.
- Recommendation cards should be scannable and action-oriented.
- Show baseline drive time, waypoint drive time, added driving minutes, recommendation reason, and navigation action clearly.
- Nearby time-fit cards should show total time, one-way travel time, stay time, return time, and distance clearly.
- Manual zaturi spots should stay normalized through `UserZaturiSpot -> TravelSpot` instead of becoming a separate UI-only model.
- The home screen should feel map-first: fullscreen map backdrop, overlay search/control surfaces, bottom tabs, and bottom-sheet input steps.
- Do not make the planner copy imply turn-by-turn navigation; use exploration/recommendation language.
- Keep Korean product language natural and short.
- Use real tourism/place imagery when possible, but mock assets are acceptable during early prototyping.

## Verification

For normal code changes:

```powershell
npm run typecheck
```

After Expo or React Native dependency changes:

```powershell
npm run check:deps
npx expo-doctor@latest
```

For UI changes, run the app on at least one target:

```powershell
npm start
npm run android
```

For installed Android builds, run deterministic Maestro checks:

```powershell
npm run test:e2e
```

When validating public proxy/API behavior, run the live Maestro checks separately:

```powershell
npm run test:e2e:live
```
