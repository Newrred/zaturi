# 2026-06-23 09:44 KST - kakao web planner map

## Request

- Use Kakao Maps for the map-first planner UI, starting with the PC/web test surface.

## Context Docs Consulted

- `docs/CURRENT_DIRECTION.md`
- `docs/DEVELOPMENT_STRUCTURE.md`
- Kakao Maps Web API guide and Kakao Developers Map overview

## Summary

- Updated `PlannerMap.web.tsx` to load Kakao Maps JavaScript SDK when `EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY` is configured.
- Added Kakao map custom overlay markers and a dashed route polyline for the web planner map.
- Kept OSM/static fallback for missing JavaScript key, invalid domain setup, or SDK load failure.
- Enabled interactive web planner map use from the home screen.
- Added `EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY` to local/env examples.

## Changed Files

- `app/index.tsx`
- `.env`
- `.env.example`
- `src/components/planner/PlannerMap.web.tsx`
- `docs/CURRENT_DIRECTION.md`
- `docs/DEVELOPMENT_STRUCTURE.md`

## Verification

- `npm run typecheck` passed.
- `npm run check:react` passed with advisory warnings: existing bottom-sheet preference, `NewSpotScreen` state count, and Kakao map effect state transition warning.
- `npx react-doctor@latest --verbose --diff` passed with 100/100.
- `git diff --check` passed.
- Web HTTP smoke for `http://localhost:8090/` returned 200.

## Decisions

- Web Kakao map uses the JavaScript key, not the existing native app key.
- Native planner map remains OSM/WebView fallback for now; Android Kakao native support remains scoped to `SpotMap.android.tsx`.
- Fallback is intentionally retained so the map-first home never renders blank when Kakao key/domain setup is incomplete.

## Follow-Ups

- Add `EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY` to EAS preview if web builds are distributed.
- Register `http://localhost:8090` in Kakao Developers Web platform for local PC testing.
- Expand Android/iOS Kakao native planner support only after the web planner flow is validated.
