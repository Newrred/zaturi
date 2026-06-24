# 2026-06-05 09:40 KST - nearby mode and custom spots mvp

## Request

- Implement the next product step after confirming the north star: 자투리여행 should be a time-based travel recommendation app for spare time during movement or after arrival.
- Add a prototype-level flow for nearby spare-time recommendations and user-added zaturi spots.

## Context Docs Consulted

- `docs/CURRENT_DIRECTION.md`
- `docs/PRODUCT_FLOW.md`
- `docs/DEVELOPMENT_STRUCTURE.md`
- Expo Router SDK 54 docs via Context7

## Summary

- Split the home screen into two primary modes: moving stopover and nearby spare-time.
- Added nearby spare-time recommendation domain logic using free distance/time estimation.
- Added local-only user zaturi spot creation and persistence through the shared trip store.
- Normalized user spots into `TravelSpot` so they can appear in both route-bundle and nearby recommendation candidates.
- Added `/nearby` and `/spot/new` app routes and updated saved/detail screens to understand user-created spots.
- Updated product and structure docs to match the implemented MVP direction.

## Changed Files

- `app/index.tsx`
- `app/nearby.tsx`
- `app/spot/new.tsx`
- `app/recommendations.tsx`
- `app/saved.tsx`
- `app/spot/[id].tsx`
- `app/_layout.tsx`
- `src/components/TimeFitCard.tsx`
- `src/domain/recommendation/nearby.ts`
- `src/domain/recommendation/userSpots.ts`
- `src/domain/recommendation/recommend.ts`
- `src/domain/recommendation/types.ts`
- `src/services/routeProxy/client.ts`
- `src/store/useTripStore.ts`
- `docs/CURRENT_DIRECTION.md`
- `docs/DEVELOPMENT_STRUCTURE.md`
- `docs/PRODUCT_FLOW.md`

## Verification

- `npm run typecheck` passed.
- `npm run check:react` passed with one advisory warning: `NewSpotScreen` has many `useState` calls and can be refactored to `useReducer` later.
- HTTP smoke checks passed for `http://localhost:8082`, `/nearby`, and `/spot/new`.
- Playwright mobile-width smoke rendered home, `/nearby`, `/spot/new`, and `/saved` with 0 console errors. One React Native Web deprecation warning from framework internals remained.

## Decisions

- Nearby recommendations are currently free/offline estimates, not live road routing: straight-line distance is adjusted by movement mode and converted into travel time with simple buffers.
- User-created spots are stored locally in AsyncStorage and auto-saved to the saved list.
- Manual spot creation uses typed latitude/longitude for now; map-picking is a follow-up.
- Kakao/TourAPI-backed place search remains the way to select origin, destination, or nearby base location when the proxy is configured.

## Follow-Ups

- Test nearby scoring with real 강릉/속초 places and adjust walking/driving assumptions.
- Add a map-pick coordinate flow for user-created spots.
- Refactor `app/spot/new.tsx` form state to `useReducer` if the manual spot form grows.
- Add Maestro coverage for moving mode, nearby mode, and manual spot creation after a dev build is available.
- Consider moving user spots from local-only storage to Supabase or another backend if community/shared spots become part of the demo.
