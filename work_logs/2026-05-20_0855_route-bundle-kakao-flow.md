# 2026-05-20 08:55 KST - route bundle kakao flow

## Request

- Implement the route-first recommendation flow discussed with the user:
  - origin/destination input
  - baseline Kakao-style route
  - route corridor based spot selection
  - waypoint bundle: origin -> spot -> destination
  - user-facing added driving time

## Context Docs Consulted

- `docs/PROJECT_BRIEF.md`
- `docs/PRODUCT_FLOW.md`
- `docs/CURRENT_DIRECTION.md`
- `docs/DEVELOPMENT_STRUCTURE.md`

## Summary

- Added a Kakao API-shaped route planning domain layer.
- Updated recommendations so each card represents a waypoint route bundle instead of only a spot.
- Added origin/destination text inputs and presets to the home screen.
- Updated spot detail navigation to open an external waypoint route.
- Added route-flow documentation for future Kakao proxy integration.

## Changed Files

- `app/index.tsx`
- `app/recommendations.tsx`
- `app/spot/[id].tsx`
- `src/components/RecommendationCard.tsx`
- `src/constants/theme.ts`
- `src/data/destinations.ts`
- `src/domain/recommendation/recommend.ts`
- `src/domain/recommendation/types.ts`
- `src/domain/routing/kakaoRoutePlanner.ts`
- `src/domain/routing/types.ts`
- `src/store/useTripStore.ts`
- `src/utils/navigation.ts`
- `.env.example`
- `docs/CURRENT_DIRECTION.md`
- `docs/DEVELOPMENT_STRUCTURE.md`
- `docs/PRODUCT_FLOW.md`
- `docs/ROUTE_RECOMMENDATION_FLOW.md`

## Verification

- `npm run typecheck` passed.
- `npm run check:deps` passed.
- `npm run check:react` passed with no issues.
- `npx react-doctor@latest --verbose --diff` passed with score 100/100.
- Playwright web smoke check passed for home -> recommendations -> spot detail.
- Web console showed no app errors; only React Native Web pointer-events deprecation warnings.

## Decisions

- Do not place a Kakao REST API key in the Expo app.
- Use a Kakao API-shaped mock planner now, then replace it with a backend/proxy response later.
- Treat added driving time as the main product signal.
- Keep external navigation as the turn-by-turn handoff path for now.

## Follow-Ups

- Add a backend/proxy endpoint for Kakao Local and Kakao Mobility.
- Replace mock route planning with live proxy data.
- Add geocoded search results for arbitrary typed origins/destinations.
- Run the updated flow on Android dev build and expand Maestro coverage.
