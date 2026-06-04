# 2026-06-04 11:02 KST - apk map smoke test and fallback diagnostics

## Request

- Diagnose why the Android APK map is not showing.
- Smoke test the app with real local `.env` API keys.
- Fix implementation issues found during verification.

## Context Docs Consulted

- `docs/CURRENT_DIRECTION.md`
- `docs/PROJECT_BRIEF.md`
- `docs/PRODUCT_FLOW.md`
- `docs/DEVELOPMENT_STRUCTURE.md`
- `docs/DEVELOPMENT_TOOLING.md`
- `docs/APK_TEST_BUILD.md`
- `docs/KAKAO_PROXY.md`
- React Doctor skill instructions

## Summary

- Confirmed local `.env` contains `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY`, `EXPO_PUBLIC_ZATURI_ROUTE_PROXY_URL`, `KAKAO_REST_API_KEY`, and `TOUR_API_SERVICE_KEY`; `VWORLD_API_KEY` is not configured.
- Confirmed EAS preview environment contains `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY`.
- Downloaded and inspected the latest EAS preview APK; the Kakao native app key and Kakao map bundle strings are present in the JS bundle.
- Confirmed the APK package is `com.zaturi.app` and includes internet/network permissions.
- Extracted current APK signing fingerprints and Kakao key hash for Kakao Developers registration.
- Found public Render proxy `/health` works but `/api/places/search` returns `404`, meaning the public proxy is not running the latest local server code.
- Added Android native map error events and JS fallback to OSM when Kakao map loading fails.

## Changed Files

- `modules/zaturi-kakao-map/src/ZaturiKakaoMap.types.ts`
- `modules/zaturi-kakao-map/android/src/main/java/expo/modules/zaturikakaomap/ZaturiKakaoMapModule.kt`
- `modules/zaturi-kakao-map/android/src/main/java/expo/modules/zaturikakaomap/ZaturiKakaoMapView.kt`
- `src/components/SpotMap.android.tsx`
- `docs/APK_TEST_BUILD.md`
- `docs/CURRENT_DIRECTION.md`
- `docs/KAKAO_PROXY.md`

## Verification

- `https://zaturi.onrender.com/health` passed, but `/api/places/search` returned `404`.
- Local proxy `http://127.0.0.1:3100/health` passed with Kakao REST and TourAPI keys present.
- Local proxy `GET /api/places/search` passed for `서울역`, `강릉역`, and `대관령`.
- Local proxy `POST /api/routes/candidates` returned live Kakao Mobility baseline route and TourAPI candidates.
- Web app smoke at `http://localhost:8082` passed: home -> recommendations -> spot detail -> OSM map preview.
- Playwright console had no app errors; only development/browser warnings.
- Downloaded latest EAS APK and confirmed bundled native key, package, and permissions.
- `npm run typecheck` passed.
- `npx expo prebuild --platform android --no-install --clean` passed.
- Temporary `android/gradlew.bat :app:assembleDebug` passed after map error fallback changes.

## Decisions

- Treat current Android map failure as likely Kakao Developers authentication mismatch unless runtime logcat proves otherwise, because APK contains the key and SDK assets.
- Keep Android Kakao Maps as the preferred map, but fallback to OSM on load/init errors so testers do not see a blank map.
- Do not expose REST API keys in the app; route/search APIs remain proxy-backed.
- Public APK actual-data testing requires Render to run the latest proxy code, not just a healthy old server.

## Follow-Ups

- Register Kakao key hash `DqqGhT6gpHb6NUfDYMS09T0K+M0=` for Android package `com.zaturi.app` in Kakao Developers.
- Push latest server code and redeploy Render; then verify `/api/places/search` on the public URL before rebuilding/sharing APK.
- Rebuild EAS preview APK so it includes the new Android Kakao error fallback behavior.
- If the map still fails after key hash registration, run `adb logcat` while opening a spot detail screen and search for `ZaturiKakaoMap`, `Kakao`, or `Auth`.
