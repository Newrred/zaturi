# 2026-05-20 09:05 KST - kakao api proxy setup

## Request

- Add a small backend proxy for real Kakao Local and Kakao Mobility API calls.
- Clarify whether a Kakao API key is required for live integration.

## Context Docs Consulted

- `docs/PRODUCT_FLOW.md`
- `docs/ROUTE_RECOMMENDATION_FLOW.md`
- Kakao Local API official docs
- Kakao Mobility Directions API official docs

## Summary

- Added `server/kakao-proxy.mjs`, a local Node proxy that keeps `KAKAO_REST_API_KEY` server-side.
- Added raw proxy endpoints for Kakao Local keyword/address search and Kakao Mobility directions APIs.
- Added `/api/routes/candidates`, a normalized route-plan endpoint for the app's recommendation flow.
- Connected the Expo app's route planner to the proxy through `EXPO_PUBLIC_ZATURI_ROUTE_PROXY_URL`, with fallback to the existing Kakao-shaped mock planner.
- Added Kakao proxy docs and README links.

## Changed Files

- `server/kakao-proxy.mjs`
- `src/services/routeProxy/client.ts`
- `src/domain/routing/kakaoRoutePlanner.ts`
- `package.json`
- `.env`
- `.env.example`
- `README.md`
- `docs/KAKAO_PROXY.md`
- `docs/ROUTE_RECOMMENDATION_FLOW.md`
- `docs/CURRENT_DIRECTION.md`
- `docs/DEVELOPMENT_STRUCTURE.md`

## Verification

- `npm run typecheck` passed.
- `npm run check:react` passed with no issues.
- `npx react-doctor@latest --verbose --diff` passed with score 100/100.
- `npm run check:deps` passed.
- `node --check server/kakao-proxy.mjs` passed.
- Started the proxy briefly and confirmed `GET /health` returns `ok: true` with `hasKakaoRestApiKey: false`.
- Confirmed Kakao endpoints return a clear `503 KAKAO_REST_API_KEY_MISSING` response when no key is configured.

## Decisions

- A Kakao REST API key is required for live Kakao calls.
- The key must be stored in local server-only env vars, not in app code or `EXPO_PUBLIC_` vars.
- The app should stay usable without the key by falling back to mock route math.

## Follow-Ups

- User must create/copy a Kakao REST API key into `.env` or `.env.proxy.local`.
- Test live Kakao route responses once the key is available.
- Add search/autocomplete UI for origin and destination using `/api/kakao/local/keyword`.
