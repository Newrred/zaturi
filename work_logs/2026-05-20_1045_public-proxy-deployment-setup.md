# 2026-05-20 10:45 KST - public proxy deployment setup

## Request

- Explain how to create a public proxy URL for APK testers and prepare the repo for a simple deployment.

## Context Docs Consulted

- `server/kakao-proxy.mjs`
- `package.json`
- `docs/APK_TEST_BUILD.md`
- Render official deployment and Blueprint documentation

## Summary

- Added deployment-platform port compatibility by reading `process.env.PORT` before `KAKAO_PROXY_PORT`.
- Added `npm run start:proxy` as a deployment-friendly server start command.
- Added `render.yaml` for a Render web service running only the proxy server.
- Expanded `docs/APK_TEST_BUILD.md` with concrete public proxy creation steps.

## Changed Files

- `server/kakao-proxy.mjs`
- `package.json`
- `render.yaml`
- `docs/APK_TEST_BUILD.md`
- `work_logs/2026-05-20_1045_public-proxy-deployment-setup.md`

## Verification

- `node --check server/kakao-proxy.mjs`
- Parsed `package.json` and `eas.json` as JSON successfully.
- `npm run typecheck`
- `npx react-doctor@latest --verbose --diff` returned 100/100 with no issues.

## Decisions

- Recommend Render first because this project only needs a small Node web service and Render can read `render.yaml`.
- Keep API keys as host environment variables with `sync: false`; do not commit or expose secret values.
- Keep the Expo app pointed at a public HTTPS proxy for tester APK builds.

## Follow-Ups

- Push the repo to GitHub.
- Create the Render service/Blueprint and enter `KAKAO_REST_API_KEY` and `TOUR_API_SERVICE_KEY`.
- Test `/health`, then set `EXPO_PUBLIC_ZATURI_ROUTE_PROXY_URL` in the EAS `preview` environment.
