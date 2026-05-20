# 2026-05-19 17:06 KST - mvp prototype screens and recommendation flow

## Request

- Build a testable MVP prototype that follows the proposal's core goal and screen flow.
- Use the previously researched libraries where they help: Expo Router, Zod, React Query, Zustand, geolib, Expo Location/Linking, react-native-maps, and AsyncStorage.

## Context Docs Consulted

- `AGENTS.md`
- `docs/CURRENT_DIRECTION.md`
- `docs/PROJECT_BRIEF.md`
- `docs/PRODUCT_FLOW.md`
- `docs/DEVELOPMENT_STRUCTURE.md`
- `docs/DEVELOPMENT_TOOLING.md`
- Expo SDK 54 docs for SDK compatibility.
- Expo Router manual installation docs.
- Expo SDK 54 docs for `react-native-maps` and AsyncStorage.

## Summary

- Installed MVP dependencies.
- Switched the app entry to Expo Router.
- Added typed app routes for home, recommendations, spot detail, saved spots, and settings.
- Added mock TourAPI-shaped Gangwon tourism spots.
- Added Zod validation for mock tourism records.
- Added a recommendation domain layer using `geolib` for simple route detour estimates.
- Added React Query for async recommendation loading.
- Added Zustand for trip criteria and saved spot state.
- Added AsyncStorage persistence without `zustand/middleware` because the middleware bundle caused an `import.meta` web runtime issue.
- Added Expo Location use for current-position based origin, with web fallback.
- Added Expo Linking for external map search.
- Added `react-native-maps` for native map previews and a web placeholder for browser testing.
- Updated Maestro smoke flow and project docs to reflect the MVP state.

## Changed Files

- `package.json`
- `package-lock.json`
- `app.json`
- `tsconfig.json`
- `App.tsx`
- `.gitignore`
- `app/_layout.tsx`
- `app/index.tsx`
- `app/recommendations.tsx`
- `app/spot/[id].tsx`
- `app/saved.tsx`
- `app/settings.tsx`
- `src/constants/theme.ts`
- `src/data/destinations.ts`
- `src/data/mockSpots.ts`
- `src/domain/recommendation/types.ts`
- `src/domain/recommendation/schema.ts`
- `src/domain/recommendation/recommend.ts`
- `src/store/useTripStore.ts`
- `src/utils/navigation.ts`
- `src/components/ui.tsx`
- `src/components/RecommendationCard.tsx`
- `src/components/SpotMap.native.tsx`
- `src/components/SpotMap.web.tsx`
- `src/types/platform-components.d.ts`
- `maestro/flows/smoke.yaml`
- `docs/CURRENT_DIRECTION.md`
- `docs/DEVELOPMENT_STRUCTURE.md`
- `docs/PRODUCT_FLOW.md`
- `work_logs/2026-05-19_1706_mvp-prototype-screens-and-recommendation-flow.md`

## Verification

- `npm run typecheck` passed.
- `npm run check:deps` passed.
- `npx --yes expo-doctor@latest` passed, 17/17 checks.
- `npm run check:react` passed with no issues.
- `npm audit --audit-level=high` passed with no high severity issues. Existing Expo transitive `postcss` moderate advisory remains; forced fix would downgrade/break Expo.
- Started Expo web on `http://localhost:8081`.
- Playwright verified home, recommendations, spot detail, saving a spot, and saved list on web.
- Playwright console had no current errors after fixes; only an Expo/RN web `pointerEvents` deprecation warning remained.

## Decisions

- Chose `geolib` instead of `@turf/turf` for the MVP to keep route-distance logic light.
- Kept actual TourAPI integration out of this pass and used validated mock data shaped like tourism records.
- Used external map search instead of own turn-by-turn navigation.
- Split map rendering between native and web because `react-native-maps` is native-oriented.
- Removed `zustand/middleware` from runtime usage because its bundled `import.meta` usage broke Expo web under the current setup.

## Follow-Ups

- Test the native Android flow with a dev build and update Maestro flows beyond smoke.
- Replace or supplement mock spots with real TourAPI samples through a script/proxy decision.
- Decide map provider terms and API key handling before distribution builds.
- Add better image/data attribution once real public data sources are connected.
