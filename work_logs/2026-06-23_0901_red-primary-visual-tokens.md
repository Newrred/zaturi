# 2026-06-23 09:01 KST - red primary visual tokens

## Request

- Implement PDF-inspired red primary design tokens and larger radii/overlay-friendly tokens.
- Preserve existing exported theme names so current code keeps compiling.
- Own only `src/constants/theme.ts`, with no route or store changes.

## Context Docs Consulted

- `docs/CURRENT_DIRECTION.md`
- `docs/CODEX_WORKFLOW.md`

## Summary

- Refreshed the app visual system from the previous green primary palette to a warm PDF-red primary palette.
- Kept all existing `colors`, `spacing`, and `radius` exported names intact.
- Added additive overlay, elevated surface, state, shadow, and larger radius tokens for future overlay-friendly UI work.

## Changed Files

- `src/constants/theme.ts`
- `work_logs/2026-06-23_0901_red-primary-visual-tokens.md`

## Verification

- `npm run typecheck` - passed.

## Decisions

- Chose accessible dark PDF-red primary values (`primary`, `primaryDark`) so existing white primary button text remains readable.
- Updated existing `radius.sm` and `radius.md` to larger values so current components inherit the softer visual system without new imports.
- Added new tokens only; no route, store, or component API changes.

## Follow-Ups

- Consider adopting `colors.overlay*`, `colors.surfaceOverlay*`, `opacity`, and `shadow` in future overlay/card polish passes.
