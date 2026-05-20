# Current Direction

Last updated: 2026-05-20

## Current Phase

Route-bundle MVP prototype.

The project now has a navigable Expo Router prototype that follows the proposal's core flow: enter/select an origin and Gangwon destination, set spare time and travel conditions, view route-bundle recommendation cards, inspect a spot detail, save a spot, and open an external waypoint route.

## Product North Star

Build `자투리여행`: a route-based tourism curation app that helps car travelers in Gangwon turn spare time into realistic short stopover experiences.

## Current Implementation Direction

- Keep the Expo-managed workflow unless a native requirement clearly forces a different approach.
- Use TypeScript-first app code.
- Prefer a simple MVP before data-heavy or native-heavy features.
- Use TourAPI for live candidate spots when keys are configured, with mock data kept as a fallback/demo safety net.
- Use the local Kakao proxy when configured, with automatic fallback to the Kakao API-shaped mock planner.
- Treat each recommendation as `origin -> spot -> destination`, not as a standalone spot.
- Keep recommendation filtering in a dedicated policy module so content type weights, keyword boosts, and exclusions can be tuned quickly.
- Use the installed development tooling selectively: Context7 for fresh docs, React Doctor for advisory React diagnostics, and Maestro for E2E flows after a dev build exists.

## Near-Term Next Steps

1. Tune `server/recommendation/tour-candidate-policy.mjs` with real demo searches and observed bad candidates.
2. Add geocoded origin/destination search UI using the proxy's Kakao Local endpoints.
3. Pull TourAPI detail/barrier-free/opening-hour data for candidates that pass the first filter.
4. Improve the MVP UI copy and visual polish after testing on a phone/emulator.
5. Expand Maestro flows after an Android dev build is installed.

## Open Questions

- Will arbitrary typed origin/destination text be geocoded immediately, or only after the user taps a confirmed search result?
- Which map provider should be used later?
- Which TourAPI detail endpoints should become authoritative for operating hours, accessibility, parking, and images?
- Is login needed for the first submitted demo?
- How much of the app needs to work offline or under weak mobile network conditions?

## Working Assumptions

- The first demo should emphasize recommendation clarity over algorithm complexity.
- External navigation apps can handle actual turn-by-turn navigation.
- Recommendation cards should explain why a stop is suitable.
- Added driving time is the primary recommendation signal.
- Accessibility and travel companion filters should exist early, even if initially simple.
- Web can use a map placeholder; native builds can use `react-native-maps`.
