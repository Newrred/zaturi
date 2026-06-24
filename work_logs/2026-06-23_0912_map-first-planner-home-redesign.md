# 2026-06-23 09:12 KST - map-first-planner-home-redesign

## Request

- Implement the map-first UI redesign plan based on the attached PDF flow screens.
- Preserve existing recommendation routes/domain logic while converting `/` into a fullscreen map planner with bottom-sheet intake.

## Context Docs Consulted

- `docs/CURRENT_DIRECTION.md`
- `docs/PRODUCT_FLOW.md`
- `docs/DEVELOPMENT_STRUCTURE.md`
- Expo SDK 54 Reanimated/Gesture Handler docs via Context7
- `@gorhom/bottom-sheet` v5 docs via Context7

## Summary

- Added bottom-sheet/native gesture dependencies and root providers.
- Hid the home Stack header and rebuilt `app/index.tsx` as a map-first planner surface.
- Added fullscreen planner map components for native and web under `src/components/planner/`.
- Added PDF-inspired red/overlay design tokens.
- Preserved existing `/recommendations`, `/nearby`, `/spot/[id]`, `/saved`, `/settings`, and `/spot/new` routes.
- Added typed-place/confirmed-coordinate guard in the new planner flow to avoid stale coordinate recommendations.
- Added latitude/longitude range validation for manually added spots.
- Added saved spot snapshots so saved live TourAPI candidates survive app reloads.
- Updated Maestro smoke labels to the new map-first home.

## Changed Files

- `app/_layout.tsx`
- `app/index.tsx`
- `app/nearby.tsx`
- `app/recommendations.tsx`
- `app/saved.tsx`
- `app/spot/[id].tsx`
- `app/spot/new.tsx`
- `docs/CURRENT_DIRECTION.md`
- `docs/DEVELOPMENT_STRUCTURE.md`
- `docs/PRODUCT_FLOW.md`
- `maestro/flows/smoke.yaml`
- `package.json`
- `package-lock.json`
- `src/constants/theme.ts`
- `src/components/planner/PlannerMap.native.tsx`
- `src/components/planner/PlannerMap.web.tsx`
- `src/components/planner/PlannerMap.types.ts`
- `src/components/planner/PlannerMap.shared.ts`
- `src/components/planner/PlannerMap.d.ts`
- `src/components/TimeFitCard.tsx`
- `src/domain/recommendation/nearby.ts`
- `src/domain/recommendation/recommend.ts`
- `src/domain/recommendation/types.ts`
- `src/domain/recommendation/userSpots.ts`
- `src/services/routeProxy/client.ts`
- `src/store/useTripStore.ts`

## Verification

- Baseline: `npm run typecheck` passed.
- Baseline: `npm run check:react` passed with existing advisory about `NewSpotScreen` state count.
- Baseline: `npm run maestro:version` returned Maestro 2.5.1.
- After dependency changes: `npm run typecheck` passed.
- After dependency changes: `npm run check:deps` passed.
- After dependency changes: `npx expo-doctor@latest` passed 18/18 checks after installing `react-native-worklets`.
- React Doctor diff: `npx react-doctor@latest --verbose --diff` passed with 100/100 after fixing prop naming and query destructuring issues.
- Web HTTP smoke on `http://localhost:8090` returned 200 for `/`, `/nearby`, `/spot/new`, and `/saved`.
- Final QA reviewer must-fix for saved live TourAPI spots was addressed by persisting saved `TravelSpot` snapshots.

## Decisions

- Use OSM/WebView/static fallback for native planner map v1; keep existing Kakao native module scoped to spot detail preview.
- Use OSM iframe plus static fallback for web planner map.
- Keep sheet snap point, search text/results, selected marker, and map camera local to home screen state.
- Do not persist raw GPS history.
- Keep result pages as standalone routes for now; map-result preview remains a later phase.
- Treat React Doctor's `@gorhom/bottom-sheet` native-sheet preference as accepted risk because the agreed plan explicitly selected `@gorhom/bottom-sheet` for map + gesture UX.

## Follow-Ups

- Add a result-preview candidate cache for unsaved live candidates, separate from saved spot snapshots.
- Add generated Android build folders under `modules/zaturi-kakao-map/android/build` to ignore/cleanup policy.
- Expand Maestro flow beyond labels once a dev build is installed.
- Add map picker for `/spot/new` instead of typed latitude/longitude.
- Convert `/recommendations` and `/nearby` into map-backed result previews in a later phase.

## Source Control Note

- Several required files are new/untracked. Before committing this work, use `git add -A` rather than `git add -u`; otherwise new route/component/domain files will be omitted.
