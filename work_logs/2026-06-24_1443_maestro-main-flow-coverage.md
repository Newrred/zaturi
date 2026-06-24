# 2026-06-24 14:43 KST - maestro main flow coverage

## Request

- Add and run broader Maestro validation for the current Android emulator test setup.

## Context Docs Consulted

- `docs/CURRENT_DIRECTION.md`
- Existing `maestro/flows/smoke.yaml`
- Home planner and saved/manual spot screen labels from route files

## Summary

- Added a planner intake flow that opens the map-first home bottom sheet, switches between nearby and moving modes, and verifies core entry text.
- Added a manual spot flow that navigates to saved spots, opens the manual spot form, fills required fields, saves, and verifies the saved spot appears.
- Verified the existing x86_64 Android emulator can run app-level Maestro tests.
- Confirmed ARM64 AVD creation is possible but ARM64 boot is not supported by this x86_64 Windows host.

## Changed Files

- `maestro/flows/planner-intake.yaml`
- `maestro/flows/manual-spot.yaml`

## Verification

- `maestro check-syntax maestro/flows/planner-intake.yaml` passed.
- `maestro check-syntax maestro/flows/manual-spot.yaml` passed.
- `maestro test maestro/flows/planner-intake.yaml` passed.
- `maestro test maestro/flows/manual-spot.yaml` passed.
- `npm run test:e2e` passed: 3/3 flows.
- `git diff --check` passed.

## Decisions

- Keep the new flows network-light so they are stable on the local emulator and do not depend on external search/API availability.
- Use x86_64 AVD for app flow automation; reserve Kakao native map final validation for a real Android device.

## Follow-Ups

- Add a separate opt-in live-search Maestro flow after the installed APK/proxy target is stable.
- Run the same flows after the next preview/dev APK is built from the current native module changes.
- Add screenshot capture or Maestro recording for map/fallback visual review if needed.
