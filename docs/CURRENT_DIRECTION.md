# Current Direction

Last updated: 2026-06-04

## Current Phase

Route-bundle MVP prototype.

The project now has a navigable Expo Router prototype that follows the proposal's core flow: enter/select an origin and Gangwon destination, set spare time and travel conditions, view route-bundle recommendation cards, inspect a spot detail, save a spot, and open an external waypoint route.

## Product North Star

Build `자투리여행`: a route-based tourism curation app that helps car travelers in Gangwon turn spare time into realistic short stopover experiences.

## Current Implementation Direction

- Keep the Expo-managed workflow unless a native requirement clearly forces a different approach.
- Use TypeScript-first app code.
- Prefer a simple MVP before data-heavy or native-heavy features.
- Use TourAPI for live candidate spots and keyword place search when keys are configured, with mock data kept as a fallback/demo safety net.
- Use the local Kakao proxy when configured, with automatic fallback to the Kakao API-shaped mock planner.
- Treat each recommendation as `origin -> spot -> destination`, not as a standalone spot.
- Keep recommendation filtering in a dedicated policy module so content type weights, keyword boosts, and exclusions can be tuned quickly.
- Treat fixed origin/destination presets as technical fallbacks only; the product flow should center on user-entered place search and coordinate confirmation.
- Show recommendation cards as comparable route bundles with a visual mini route comparison between the baseline route and the waypoint route.
- Use Kakao Maps Native SDK for the Android spot-location preview when `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY` is configured.
- If the Android Kakao map fails to load, fall back to the OSM preview and surface a diagnostic warning instead of leaving a blank map.
- Android x86_64 emulators should use the OSM fallback because the Kakao Maps SDK native library in the current build is ARM-only; verify the Kakao native map on an ARM Android device.
- Keep OpenStreetMap embed/WebView as the iOS/web fallback and as an Android fallback when the Kakao native key is missing.
- Use the installed development tooling selectively: Context7 for fresh docs, React Doctor for advisory React diagnostics, and Maestro for E2E flows after a dev build exists.

## Near-Term Next Steps

1. Tune `server/recommendation/tour-candidate-policy.mjs` with real demo searches and observed bad candidates.
2. Add optional VWorld or road-address keys for broader address-to-coordinate search without relying on Kakao Local.
3. Pull TourAPI detail/barrier-free/opening-hour data for candidates that pass the first filter.
4. Improve the MVP UI copy and visual polish after testing on a phone/emulator.
5. Expand Maestro flows after an Android dev build is installed.
6. Push and redeploy the latest `server/kakao-proxy.mjs` before relying on a public APK; `/api/places/search` must work on the public proxy, not only locally.
7. Verify the Android Kakao map preview in a dev/preview APK after registering the Android package and key hash in Kakao Developers.
8. Decide whether to add the Kakao iOS SDK bridge next or keep iOS on OSM until the map UX stabilizes.

## Open Questions

- Will arbitrary typed origin/destination text be geocoded immediately, or only after the user taps a confirmed search result?
- Should iOS receive a native Kakao bridge immediately, or remain on OSM until the Android prototype is validated?
- How much OSM tile/embed traffic is acceptable for the demo before moving to VWorld, Kakao Maps, or a self-hosted/commercial tile provider?
- Which TourAPI detail endpoints should become authoritative for operating hours, accessibility, parking, and images?
- Is login needed for the first submitted demo?
- How much of the app needs to work offline or under weak mobile network conditions?

## Working Assumptions

- The first demo should emphasize recommendation clarity over algorithm complexity.
- External navigation apps can handle actual turn-by-turn navigation.
- Recommendation cards should explain why a stop is suitable.
- Added driving time is the primary recommendation signal.
- Accessibility and travel companion filters should exist early, even if initially simple.
- Android can show a native Kakao pin preview through `SpotMap.android.tsx`; iOS/web still use OSM fallback until their provider decision is final.
