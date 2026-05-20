# 2026-05-20 10:00 KST - tour api candidate integration

## Request

- User added the TourAPI key to `.env`.
- Connect TourAPI as the real candidate spot source for the route recommendation flow.

## Context Docs Consulted

- Official data.go.kr TourAPI GW page.
- `docs/ROUTE_RECOMMENDATION_FLOW.md`
- `docs/KAKAO_PROXY.md`

## Summary

- Added TourAPI key detection to the local proxy health check.
- Added a TourAPI `locationBasedList2` client inside `server/kakao-proxy.mjs`.
- Added TourAPI item mapping into the app's normalized `TravelSpot` shape.
- Updated `/api/routes/candidates` to prefer TourAPI route-adjacent candidates, then fall back to mock spots when TourAPI is unavailable.
- Updated the Expo route-proxy client to request TourAPI-preferred candidate generation.
- Added TourAPI integration docs.

## Changed Files

- `server/kakao-proxy.mjs`
- `src/domain/routing/types.ts`
- `src/services/routeProxy/client.ts`
- `src/domain/recommendation/recommend.ts`
- `.env.example`
- `README.md`
- `docs/TOUR_API_INTEGRATION.md`
- `docs/ROUTE_RECOMMENDATION_FLOW.md`

## Verification

- `TOUR_API_SERVICE_KEY` line is present with a value in `.env`.
- `node --check server/kakao-proxy.mjs` passed.
- `npm run typecheck` passed.
- Temporary proxy health check returned `hasTourApiServiceKey: true`.
- After the user confirmed approval, direct TourAPI calls returned `resultCode: 0000`.
- Fixed proxy TourAPI URL construction: leading slashes were dropping the `/B551011/KorService2` path and causing `Unexpected errors`.
- Proxy `GET /api/tour/location` now returns real TourAPI location-based candidates.
- `/api/routes/candidates` now returns TourAPI candidate spots plus Kakao route assessments.
- Fixed fallback spot payload so mock fallback keeps full `TravelSpot` fields for scoring.
- Restarted the local proxy on port `3000`.
- Playwright confirmed the recommendation screen shows TourAPI candidate spot cards with live Kakao route timing and no console errors.

## Decisions

- Keep TourAPI keys server-only.
- Use TourAPI only for candidate inventory; keep Kakao Mobility responsible for actual route/time evaluation.
- Keep estimated fields such as stay time, walking minutes, parking, and accessibility clearly separate from TourAPI-provided basics.

## Follow-Ups

- Add TourAPI detail endpoints after basic location-based candidates work.
- Replace estimated parking/accessibility data with TourAPI/detail or barrier-free data where possible.
- Improve candidate filtering so route-adjacent food/accommodation/camping entries do not crowd out stronger tourist stopovers.
