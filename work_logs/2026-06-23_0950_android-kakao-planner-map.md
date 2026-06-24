# 2026-06-23 09:50 KST - android kakao planner map

## Request

- Ensure the actual Android app uses Kakao Maps for the map-first planner, not only the PC/web Kakao map.

## Context Docs Consulted

- `docs/CURRENT_DIRECTION.md`
- `docs/DEVELOPMENT_STRUCTURE.md`
- Existing local `modules/zaturi-kakao-map` native module files

## Summary

- Added `PlannerMap.android.tsx` so Android APK/dev builds use the local Kakao Maps native module for the fullscreen home planner map.
- Extended the local Kakao map module with `markersJson` so planner origin/destination/base/candidate markers can be drawn as native Kakao labels.
- Kept OSM/WebView/static fallback for missing native app key, unsupported emulator ABI, or Kakao map load errors.
- Left iOS on the existing `.native.tsx` OSM fallback.

## Changed Files

- `src/components/planner/PlannerMap.android.tsx`
- `modules/zaturi-kakao-map/src/ZaturiKakaoMap.types.ts`
- `modules/zaturi-kakao-map/android/src/main/java/expo/modules/zaturikakaomap/ZaturiKakaoMapModule.kt`
- `modules/zaturi-kakao-map/android/src/main/java/expo/modules/zaturikakaomap/ZaturiKakaoMapView.kt`
- `docs/CURRENT_DIRECTION.md`
- `docs/DEVELOPMENT_STRUCTURE.md`

## Verification

- `npm run typecheck` passed.
- `git diff --check` passed.
- Android/Kotlin compile not run locally because this workspace currently has no generated `android/` project folder. Validate through `npm run build:android:dev` or `npm run build:android:preview`.

## Decisions

- Android app map uses `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY`, not the JavaScript key.
- Planner marker rendering is native label based for Android. Native route polylines are deferred; route context can still be shown in result cards and external navigation.
- Android x86_64 emulator fallback remains intentional because Kakao Maps SDK native libraries are ARM-focused in the current setup.

## Follow-Ups

- Run an Android dev/preview build on an ARM Android device and verify Kakao map load, marker labels, and fallback behavior.
- Add native Kakao route polyline support if map-backed result preview becomes part of the next phase.
- Decide whether to build an iOS Kakao native bridge or keep iOS on OSM fallback for the prototype.
