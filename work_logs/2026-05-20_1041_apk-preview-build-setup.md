# 2026-05-20 10:41 KST - apk preview build setup

## Request

- Explain and prepare the project for sending an Android APK to testers so they can try the current live-data MVP without setting up Expo locally.

## Context Docs Consulted

- `eas.json`
- `app.json`
- `.env.example`
- `docs/KAKAO_PROXY.md`
- Expo EAS Build internal distribution documentation

## Summary

- Made the EAS `preview` build profile explicitly produce an Android APK for internal distribution.
- Added a `build:android:preview` npm script for production-like tester APK builds without dev-client tooling.
- Added `docs/APK_TEST_BUILD.md` describing the required public proxy URL, EAS preview environment variable, and tester build flow.
- Linked the APK test build guide from the README.

## Changed Files

- `eas.json`
- `package.json`
- `docs/APK_TEST_BUILD.md`
- `README.md`
- `work_logs/2026-05-20_1041_apk-preview-build-setup.md`

## Verification

- Parsed `eas.json`, `package.json`, and `app.json` as JSON successfully.
- `npm run typecheck`
- `npx react-doctor@latest --verbose --diff` returned 100/100 with no issues.

## Decisions

- Use EAS internal distribution for Android APK testing.
- Keep real Kakao/TourAPI keys server-side only.
- Require a public HTTPS deployment of `server/kakao-proxy.mjs` before expecting another tester's phone to receive real Kakao/TourAPI data.
- Keep local `localhost` proxy settings for desktop development only.

## Follow-Ups

- Deploy the proxy to a public host such as Render, Railway, Fly.io, or a VPS.
- Set `EXPO_PUBLIC_ZATURI_ROUTE_PROXY_URL` in the EAS `preview` environment to the deployed proxy URL.
- Run `npm run build:android:preview` after the public proxy is reachable.
