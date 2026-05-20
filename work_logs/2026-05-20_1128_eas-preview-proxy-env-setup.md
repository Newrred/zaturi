# 2026-05-20 11:28 KST - eas preview proxy env setup

## Request

- Continue toward APK packaging and set the EAS preview build environment so tester builds use the public proxy.

## Context Docs Consulted

- `eas.json`
- `.env`
- `docs/APK_TEST_BUILD.md`
- Public proxy health/check results for `https://zaturi.onrender.com`

## Summary

- Confirmed the public proxy URL for tester builds is `https://zaturi.onrender.com`.
- Added `EXPO_PUBLIC_ZATURI_ROUTE_PROXY_URL=https://zaturi.onrender.com` to the EAS `preview` build profile.
- Updated local `.env` to point Expo at the same public proxy for local sanity testing.
- Attempted to use EAS CLI, but the local terminal is not logged in to Expo/EAS.

## Changed Files

- `eas.json`
- `.env`
- `docs/APK_TEST_BUILD.md`
- `work_logs/2026-05-20_1128_eas-preview-proxy-env-setup.md`

## Verification

- Parsed `eas.json` and `package.json` as JSON successfully.
- `npm run typecheck`
- `npx react-doctor@latest --verbose --diff`
- `https://zaturi.onrender.com/health` returned `ok: true`, `hasKakaoRestApiKey: true`, and `hasTourApiServiceKey: true`.
- `npx --yes eas-cli@latest whoami` returned `Not logged in`; EAS remote env/build commands still need login.

## Decisions

- Use `eas.json` `preview.env` for the public proxy URL because this value is intentionally public and does not need EAS secret storage.
- Keep Kakao and TourAPI service keys only in Render server-side environment variables.
- Do not attempt to build until Expo/EAS login is available.

## Follow-Ups

- Run `npx eas-cli@latest login`.
- Run `npm run build:android:preview`.
- Share the resulting EAS install URL or downloaded APK with testers.
