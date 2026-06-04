# 2026-06-04 09:22 KST - android kakao map sdk spot preview

## Request

- Use Kakao Maps Native SDK for the app map preview, considering iOS later but applying Android first.

## Context Docs Consulted

- `docs/CURRENT_DIRECTION.md`
- `docs/DEVELOPMENT_STRUCTURE.md`
- `docs/DEVELOPMENT_TOOLING.md`
- `docs/ROUTE_RECOMMENDATION_FLOW.md`
- Expo Modules / Expo SDK 54 native module docs
- Kakao Maps Android SDK docs and distributed AAR API surface

## Summary

- Added a local Expo native module at `modules/zaturi-kakao-map` that wraps Kakao Maps Android SDK.
- Added Android-specific `src/components/SpotMap.android.tsx` so Android uses Kakao Maps when `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY` is configured.
- Kept OSM/WebView fallback for Android without a native key, and left iOS/web fallback behavior intact.
- Configured the Kakao Maven repository through `expo-build-properties`.
- Documented the Native App Key distinction from the server-side Kakao REST API key.

## Changed Files

- `app.json`
- `.env.example`
- `.env` local variable placeholder only
- `package.json`
- `package-lock.json`
- `modules/zaturi-kakao-map/**`
- `src/components/SpotMap.android.tsx`
- `docs/CURRENT_DIRECTION.md`
- `docs/DEVELOPMENT_STRUCTURE.md`
- `docs/DEVELOPMENT_TOOLING.md`
- `docs/APK_TEST_BUILD.md`
- `docs/ROUTE_RECOMMENDATION_FLOW.md`

## Verification

- `npm run typecheck` passed.
- `npm run check:deps` passed.
- `npx expo config --json` passed.
- `npx expo prebuild --platform android --no-install --clean` passed.
- Temporary native Gradle compile: `android/gradlew.bat :app:assembleDebug` passed after adding nullable guards for Kakao `labelManager/layer`.
- Removed the temporary generated `android/` directory after verification.

## Decisions

- Do not expose the Kakao REST API key in the app. Continue using it only in `server/kakao-proxy.mjs`.
- Use Kakao Native App Key in `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY` for map rendering because Kakao native maps are client SDKs by design.
- Keep the JS-facing map props simple (`latitude`, `longitude`, `title`, `subtitle`, `zoomLevel`) so an iOS bridge can be added later without changing screens.
- Keep OSM fallback to avoid blocking development/test builds before Kakao app key/hash registration is complete.

## Follow-Ups

- Put the Kakao Native App Key into `.env` locally and into the EAS preview environment before building a tester APK.
- Register Android package `com.zaturi.app` and the debug/release key hash in Kakao Developers.
- Test on a physical Android device or emulator with a dev/preview build.
- Add a Kakao iOS SDK bridge or keep iOS on OSM until Android UX is validated.
