# 2026-06-02 16:54 KST - route visual comparison and osm map preview

## Request

- Add two free MVP features before deciding whether to switch to Kakao Maps:
  - Visual comparison between the baseline route and each waypoint route.
  - A simple map preview with a pin on the spot detail screen.
- Clarify whether Kakao APIs are paid.

## Context Docs Consulted

- `docs/CURRENT_DIRECTION.md`
- `docs/PROJECT_BRIEF.md`
- `docs/PRODUCT_FLOW.md`
- `docs/DEVELOPMENT_STRUCTURE.md`
- `docs/DEVELOPMENT_TOOLING.md`
- Expo SDK 54 docs for `react-native-svg` and `react-native-webview`
- Context7 docs for `react-native-svg`
- Official Kakao quota/pricing pages
- OpenStreetMap embed/tile usage references

## Summary

- Added `RouteMiniMap`, an SVG-only mini route visualization for recommendation cards.
- Connected live waypoint-route polylines from the proxy into app-owned route models.
- Switched native and web spot map previews to OpenStreetMap embed, using WebView on native and iframe on web.
- Added Expo-compatible `react-native-svg` and `react-native-webview`.
- Updated project direction/docs to record the current free map-preview approach and production caveat.

## Changed Files

- `src/components/RouteMiniMap.tsx`
- `src/components/RecommendationCard.tsx`
- `src/components/SpotMap.native.tsx`
- `src/components/SpotMap.web.tsx`
- `src/domain/routing/types.ts`
- `src/domain/routing/kakaoRoutePlanner.ts`
- `src/utils/openStreetMap.ts`
- `server/kakao-proxy.mjs`
- `package.json`
- `package-lock.json`
- `docs/CURRENT_DIRECTION.md`
- `docs/ROUTE_RECOMMENDATION_FLOW.md`
- `docs/DEVELOPMENT_STRUCTURE.md`
- `docs/DEVELOPMENT_TOOLING.md`
- `docs/APK_TEST_BUILD.md`

## Verification

- `node --check server/kakao-proxy.mjs`
- `npm run typecheck`
- `npm run check:deps`
- `npx react-doctor@latest --verbose --diff` -> 100/100, no issues
- Temporary proxy on port `3010`:
  - `/health` returned `ok: true`
  - sample `/api/routes/candidates` returned one live assessment with baseline polyline count `1819` and waypoint polyline count `2311`
- Browser checks:
  - `http://localhost:8082/recommendations` rendered recommendation cards with the route comparison mini-map and no console errors.
  - `http://localhost:8082/spot/daegwallyeong-sheep` rendered the OpenStreetMap pin preview and no console errors.

## Decisions

- Use SVG for route comparison so the recommendation list does not depend on a map tile provider.
- Use OpenStreetMap embed for a free single-pin preview in the MVP.
- Keep Kakao Mobility route calculations as the current live route data source when configured, but avoid Kakao Maps/Local for this visual-map step.
- Treat OSM embed as prototype validation only; production traffic/provider choice remains open.

## Follow-Ups

- Rebuild the Android preview APK to include the new native dependencies.
- Revisit VWorld/Kakao/self-hosted/commercial map tiles before public or high-traffic release.
- Tune route-card visual labels after phone testing.
