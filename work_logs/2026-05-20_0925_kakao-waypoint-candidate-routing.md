# 2026-05-20 09:25 KST - kakao waypoint candidate routing

## Request

- Update Kakao route candidate evaluation so recommendations can use real route data reliably without excessive API calls.

## Context Docs Consulted

- Kakao Mobility waypoint directions official docs
- `docs/KAKAO_PROXY.md`
- `docs/ROUTE_RECOMMENDATION_FLOW.md`

## Summary

- Replaced the long-distance candidate evaluator in `server/kakao-proxy.mjs`.
- The proxy now calls baseline Kakao directions once, filters candidate spots by route-polyline distance, then calls Kakao waypoint directions only for the nearest bounded candidate set.
- Added dev CORS allowance for both Expo web ports `8081` and `8082`.
- Added route tuning env vars for corridor width, waypoint candidate limit, and waypoint concurrency.
- Restarted the local proxy on port `3000` with the new code.

## Changed Files

- `server/kakao-proxy.mjs`
- `.env`
- `.env.example`
- `docs/KAKAO_PROXY.md`
- `docs/ROUTE_RECOMMENDATION_FLOW.md`

## Verification

- `node --check server/kakao-proxy.mjs` passed.
- `npm run typecheck` passed.
- Temporary proxy on port `3001` returned live Kakao assessments for `Jamsil -> Sokcho` candidates.
- Restarted the port `3000` proxy.
- Playwright confirmed `http://localhost:8081/recommendations` shows `카카오 API` and live recommendation cards.
- Playwright confirmed `http://localhost:8082/recommendations` also shows live recommendation cards with no CORS errors.

## Decisions

- Avoid Kakao multi-origin/multi-destination as the main long-distance candidate evaluator because the radius constraint can reject travel candidates.
- Keep request volume bounded by filtering locally before calling waypoint directions.
- Default waypoint evaluation limit: 8 candidates.
- Default waypoint concurrency: 3 calls.

## Follow-Ups

- Add route response caching to reduce repeated Kakao calls for the same origin/destination/spot bundle.
- Add live Kakao Local search UI for typed origins and destinations.
- Replace mock spot inventory with TourAPI-backed spot data.
