# 2026-06-04 12:07 KST - android emulator map fallback and media url fix

## Request

- Diagnose the preview APK on a local Android emulator after `eas build:run` failed to boot the selected emulator.
- Verify the recommendation flow and map preview with the real configured API keys.
- Fix issues found during smoke testing.

## Context Docs Consulted

- `docs/CURRENT_DIRECTION.md`
- `docs/DEVELOPMENT_STRUCTURE.md`
- `react-doctor` skill instructions

## Summary

- Manually launched the Android emulator with `-no-snapshot -gpu swiftshader_indirect` after the default EAS runner hit an emulator crash.
- Installed and launched EAS preview build `e1907ee3-934c-4c13-85c2-9bcb3480a393`.
- Verified route-bundle recommendations load with live route data and TourAPI candidates.
- Found that Kakao Maps SDK native library loading fails on the x86_64 emulator because the bundled native library is ARM-only.
- Added native fallback handling so unsupported emulator ABI or native library errors surface through `onMapError` and switch to the OSM preview instead of leaving a blank map.
- Refined the Android ABI guard to use the primary device ABI, because the local x86_64 emulator also reports `arm64-v8a` through native bridge translation.
- Normalized `http://` media URLs to `https://` on both the server mapping path and the client image display path to avoid Android cleartext image blocking.

## Changed Files

- `modules/zaturi-kakao-map/android/src/main/java/expo/modules/zaturikakaomap/ZaturiKakaoMapView.kt`
- `server/recommendation/tour-candidate-policy.mjs`
- `src/utils/mediaUrl.ts`
- `src/components/RecommendationCard.tsx`
- `app/spot/[id].tsx`
- `docs/CURRENT_DIRECTION.md`

## Verification

- `npm run typecheck`
- `node --check server/recommendation/tour-candidate-policy.mjs`
- `npx react-doctor@latest --verbose --diff`
- `npx expo prebuild --platform android --no-install --clean`
- `.\gradlew.bat :app:assembleDebug --no-daemon --stacktrace` from generated `android/`
- Manual smoke on existing APK before the fix: launch, route search, recommendations, spot detail, and map section.
- Manual smoke on preview build `eb8acebd-64f2-4ecb-9945-4ada00b40288`: route recommendations load, card images render, and the x86_64 emulator shows OSM fallback instead of a blank Kakao map.
- Final preview build `e7f7444f-c8d1-4cff-ae84-0a9ea8b8f905`: installed on the x86_64 emulator, route recommendations load, card images render, spot detail opens, OSM fallback appears, and logcat shows the expected `UNSUPPORTED_ABI` warning without the previous native library or cleartext image errors.

## Decisions

- Keep Kakao native map as the target Android provider for ARM Android devices.
- Treat x86_64 Android emulators as an OSM fallback environment because the current Kakao Maps SDK native library cannot load there.
- Keep client-side media URL normalization even after server-side normalization so old public proxy responses remain safe in preview APKs.

## Follow-Ups

- Build a fresh preview APK containing the fallback fix.
- Test Kakao native map rendering on a physical ARM Android device after installing the fresh APK.
- Redeploy the public proxy after committing the server-side media URL normalization.
