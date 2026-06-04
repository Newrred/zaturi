# 2026-06-02 11:05 KST - search-first place selection flow

## Request

- Move the MVP away from fixed origin/destination presets because that flow does not match the actual service intent.
- Implement a search-first place selection flow where users search for origin/destination and select concrete coordinate results before calculating route-bundle recommendations.

## Context Docs Consulted

- `docs/PRODUCT_FLOW.md`
- `docs/CURRENT_DIRECTION.md`
- `docs/ROUTE_RECOMMENDATION_FLOW.md`
- `docs/TOUR_API_INTEGRATION.md`
- Official TourAPI data.go.kr page
- Official VWorld Geocoder API reference

## Summary

- Added `GET /api/places/search?query=...&role=origin|destination` to the proxy.
- Search currently uses TourAPI `searchKeyword2`, token-expanded keyword search, and nearby TourAPI lookup around seed results.
- Added optional VWorld address geocoding support through `VWORLD_API_KEY`.
- Replaced the home screen's preset chips with explicit place search fields and selectable result cards.
- Updated the trip store to persist arbitrary destination coordinates instead of deriving destinations only from preset ids.
- Updated recommendation and spot-detail screens to use the selected destination coordinate.
- Added `expo-image` and aligned Expo patch dependencies after React Doctor and Expo dependency checks.

## Changed Files

- `server/kakao-proxy.mjs`
- `src/services/routeProxy/client.ts`
- `src/store/useTripStore.ts`
- `app/index.tsx`
- `app/recommendations.tsx`
- `app/spot/[id].tsx`
- `.env.example`
- `.env` (local development proxy URL only)
- `package.json`
- `package-lock.json`
- `render.yaml`
- `docs/PRODUCT_FLOW.md`
- `docs/CURRENT_DIRECTION.md`
- `docs/ROUTE_RECOMMENDATION_FLOW.md`
- `docs/TOUR_API_INTEGRATION.md`
- `docs/APK_TEST_BUILD.md`
- `work_logs/2026-06-02_1105_search-first-place-selection-flow.md`

## Verification

- `node --check server/kakao-proxy.mjs`
- `npm run check:deps`
- `npm run typecheck`
- `npx react-doctor@latest --verbose --diff` returned 100/100 with no issues.
- Restarted the local proxy on port `3000`; `/health` returned Kakao and TourAPI keys loaded, VWorld key absent.
- `GET /api/places/search?query=속초 중앙시장&role=destination` returned TourAPI-backed selectable place results.
- `GET /api/places/search?query=강릉 커피&role=destination` returned results such as `강릉커피거리`.
- `POST /api/routes/candidates` with arbitrary selected coordinates returned live Kakao Mobility route data and TourAPI candidates.

## Decisions

- Keep fixed presets only as technical fallback data, not as the primary user flow.
- Use TourAPI first because the project already has an approved TourAPI key and the service goal is tourism-oriented.
- Treat VWorld as the next free/public address-search provider; it requires a separate free key and is optional for now.
- Do not make Kakao Local the default because Kakao Map/Local activation and cost policy are separate from the already-working Kakao Mobility route calculation.

## Follow-Ups

- Issue and configure `VWORLD_API_KEY` on Render and local `.env` for broader address-to-coordinate search.
- Redeploy Render after committing these changes; the current public proxy will not expose `/api/places/search` until redeployed from the updated repo.
- Test search-first flow on Android after a new preview APK build.
- Add more robust provider ranking once VWorld or another address provider is active.
