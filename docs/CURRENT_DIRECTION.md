# Current Direction

Last updated: 2026-06-23

## Current Phase

Map-first time-based travel recommendation MVP prototype.

The project currently has a navigable Expo Router prototype for two core flows: enter/select an origin and Gangwon destination to view route-bundle stopover recommendations, or choose a current/base location to view spare-time nearby recommendations. The home screen is now a map-first planner surface with a fullscreen map backdrop, search entry, floating controls, bottom tabs, and a bottom-sheet intake flow for place, spare-time, and condition inputs. Users can inspect a spot detail, save a spot, manually add a local-only zaturi spot, and open an external map or waypoint route.

The product direction is expanding from only "stopover recommendations while moving" into a broader time-based travel recommendation service. The app should help users turn spare time into a worthwhile short experience whether they are already moving toward a destination or have arrived somewhere and suddenly have time left.

## Product North Star

Build `자투리여행`: a time-based travel recommendation app that turns spare time into worthwhile experiences, whether the user is moving between places or already at a place with time left.

In one sentence:

`자투리여행은 목적지 중심 여행 앱이 아니라, 이동 중이든 도착 후든 남는 시간을 쓸 만한 경험으로 바꿔주는 시간 기반 여행 추천 앱.`

## Core Product Modes

1. Moving stopover mode
   - User has an origin and destination.
   - App recommends route bundles such as `origin -> spot -> destination`.
   - Primary proof is added travel time: baseline route vs waypoint route.

2. Nearby spare-time mode
   - User is already at a place or uses current location.
   - App recommends nearby things to do within a spare-time budget.
   - Primary proof is usable time fit: travel time + stay time + optional return buffer.

3. My zaturi spots
   - User can save or manually add small unregistered spots.
   - These spots become personal candidates that can appear in moving stopover mode and nearby spare-time mode.
   - Later, these can become curated/community spots for locals, repeat travelers, and foreign visitors.

## Current Implementation Direction

- Keep the Expo-managed workflow unless a native requirement clearly forces a different approach.
- Use TypeScript-first app code.
- Prefer a simple MVP before data-heavy or native-heavy features.
- Treat the home screen as a map-first planner entry point: moving stopover and nearby spare-time.
- Use TourAPI for live candidate spots and keyword place search when keys are configured, with mock data kept as a fallback/demo safety net.
- Use the local Kakao proxy when configured, with automatic fallback to the Kakao API-shaped mock planner.
- Treat route-bundle recommendations as `origin -> spot -> destination`, not as standalone spots.
- Add a second recommendation shape for nearby spare-time use: `current/base location -> spot -> optional return/base`.
- Keep the product centered on spare time, not destination discovery.
- Keep recommendation filtering in a dedicated policy module so content type weights, keyword boosts, and exclusions can be tuned quickly.
- Treat fixed origin/destination presets as technical fallbacks only; the product flow should center on user-entered place search and coordinate confirmation.
- Show moving-mode recommendation cards as comparable route bundles with a visual mini route comparison between the baseline route and the waypoint route.
- Show nearby-mode recommendation cards as time-fit options with travel time, stay time, walking/driving burden, and why the spot fits the selected spare time.
- Keep `/recommendations` and `/nearby` as standalone result routes until map-backed result previews are implemented.
- Use Kakao Maps JavaScript SDK for the web fullscreen planner map when `EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY` is configured, with OSM/static fallback when the key or domain setup is missing.
- Use the Android Kakao native module for the fullscreen planner map when `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY` is configured, with OSM/WebView/static fallback for missing key, unsupported emulator ABI, or map load errors.
- Keep iOS native fullscreen planner map on OSM/WebView/static fallback until an iOS Kakao native bridge is added.
- Keep manually added zaturi spots local-only for now, but normalize them into `TravelSpot` so they can appear in both recommendation modes.
- Persist saved spot snapshots with saved IDs so live TourAPI candidates remain visible in `/saved` and `/spot/[id]` after reloads.
- Use Kakao Maps Native SDK for the Android planner map and spot-location preview when `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY` is configured.
- If the Android Kakao map fails to load, fall back to the OSM preview and surface a diagnostic warning instead of leaving a blank map.
- Android x86_64 emulators should use the OSM fallback because the Kakao Maps SDK native library in the current build is ARM-only; verify the Kakao native map on an ARM Android device.
- Keep OpenStreetMap embed/WebView as the iOS/native fallback and as an Android fallback when the Kakao native key is missing.
- Use the installed development tooling selectively: Context7 for fresh docs, React Doctor for advisory React diagnostics, and Maestro for E2E flows after a dev build exists.

## Near-Term Next Steps

1. Validate the map-first home on Android dev/preview build and web, including bottom-sheet gesture/keyboard behavior.
2. Add map-backed result previews so `/recommendations` and `/nearby` candidates can be inspected from the planner map before opening detail.
3. Verify saved spot snapshot migration against older local AsyncStorage data and add a result-preview candidate cache for unsaved live candidates.
4. Add a map-pick flow for manually added zaturi spots instead of requiring typed latitude/longitude.
5. Validate the nearby spare-time scoring with real places around 강릉/속초 and adjust walking/driving time assumptions.
6. Tune `server/recommendation/tour-candidate-policy.mjs` with real demo searches and observed bad candidates.
7. Add optional VWorld or road-address keys for broader address-to-coordinate search without relying on Kakao Local.
8. Pull TourAPI detail/barrier-free/opening-hour data for candidates that pass the first filter.
9. Expand Maestro flows after an Android dev build is installed.
10. Push and redeploy the latest `server/kakao-proxy.mjs` before relying on a public APK; `/api/places/search` must work on the public proxy, not only locally.
11. Verify the Android Kakao map preview in a dev/preview APK after registering the Android package and key hash in Kakao Developers.

## Open Questions

- Will arbitrary typed origin/destination text be geocoded immediately, or only after the user taps a confirmed search result?
- Should iOS receive a native Kakao bridge immediately, or remain on OSM until the Android prototype is validated?
- Should the Android Kakao native planner bridge add true native route polylines and richer marker selection before result-map mode?
- How much OSM tile/embed traffic is acceptable for the demo before moving to VWorld, Kakao Maps, or a self-hosted/commercial tile provider?
- Which TourAPI detail endpoints should become authoritative for operating hours, accessibility, parking, and images?
- Is login needed for the first submitted demo?
- How much of the app needs to work offline or under weak mobile network conditions?
- Should manually added zaturi spots remain private in MVP, or should the demo include a mock public/community layer?
- For nearby spare-time mode, should the default base be current GPS, selected place, or last destination?

## Working Assumptions

- The first demo should emphasize recommendation clarity over algorithm complexity.
- External navigation apps can handle actual turn-by-turn navigation.
- Recommendation cards should explain why a stop is suitable.
- Added driving time is the primary recommendation signal in moving stopover mode.
- Total usable time fit is the primary recommendation signal in nearby spare-time mode.
- Accessibility and travel companion filters should exist early, even if initially simple.
- Android can show native Kakao maps in the home planner and spot preview; web home can use Kakao Maps JS when the JavaScript key/domain are configured; iOS still uses OSM fallback until its provider decision is final.
