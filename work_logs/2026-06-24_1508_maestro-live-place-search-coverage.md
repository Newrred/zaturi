# 2026-06-24 15:08 KST - maestro live place search coverage

## Request

- 실제 장소 검색이 중요하므로, 앱 UI에서 실제 검색 결과 선택까지 검증할 수 있는 테스트를 추가한다.

## Context Docs Consulted

- `docs/CURRENT_DIRECTION.md`
- `docs/DEVELOPMENT_STRUCTURE.md`

## Summary

- Added a separate live Maestro flow for network/API-dependent place search coverage.
- The live flow searches the public proxy-backed TourAPI path with `P.E.I`, selects the real result `P.E.I coffee`, confirms coordinates, and enters the nearby spare-time result screen.
- Added `npm run test:e2e:live` so live API checks stay separate from deterministic emulator smoke flows.
- Added `clearState` to deterministic Maestro flows to prevent persisted Zustand/AsyncStorage state from leaking between flow runs.
- Documented the split between `maestro/flows` and `maestro/live-flows`.

## Changed Files

- `package.json`
- `maestro/live-flows/live-place-search.yaml`
- `maestro/flows/smoke.yaml`
- `maestro/flows/planner-intake.yaml`
- `maestro/flows/manual-spot.yaml`
- `docs/DEVELOPMENT_STRUCTURE.md`

## Verification

- Local/public API check: `고래책방` returned real TourAPI results from both `http://localhost:3000` and `https://zaturi.onrender.com`.
- Public API check: `P.E.I` returned real TourAPI results including `P.E.I coffee`.
- `maestro check-syntax` passed for all deterministic and live flows.
- `maestro test maestro/live-flows/live-place-search.yaml` passed.
- `npm run test:e2e:live` passed.
- `npm run test:e2e` passed after adding per-flow state resets.
- `npm run typecheck` passed.
- `git diff --check` passed.

## Decisions

- Keep live API E2E checks under `maestro/live-flows` because they depend on Render, public proxy configuration, TourAPI availability, and network latency.
- Use an ASCII query in Maestro because Maestro 2.5.1 on Android rejects Korean `inputText`; Korean place search is still validated at API level.

## Follow-Ups

- Add an app-side debug/test hook or upgrade the automation path if Korean text input must be covered directly in UI automation.
- Consider adding a small Node smoke script for Korean place search if it becomes part of release gating.
