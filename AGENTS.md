# Codex Project Guide

This project is an Expo + React Native + TypeScript app.

Product context lives in:

- `docs/PROJECT_BRIEF.md`
- `docs/PRODUCT_FLOW.md`
- `docs/CURRENT_DIRECTION.md`
- `docs/DEVELOPMENT_STRUCTURE.md`
- `docs/CODEX_WORKFLOW.md`
- `docs/DEVELOPMENT_TOOLING.md`

## Baseline

- Expo SDK: 54
- React Native: 0.81
- React: 19.1
- Node.js: use the version in `.nvmrc` / `.node-version`
- Package manager: npm with `package-lock.json`

## Working Rules

- Start meaningful work by reading `docs/CURRENT_DIRECTION.md`.
- For product or screen-flow work, also read `docs/PROJECT_BRIEF.md` and `docs/PRODUCT_FLOW.md`.
- For architecture, folder, or code organization changes, also read `docs/DEVELOPMENT_STRUCTURE.md`.
- For dependency/tooling choices, read `docs/DEVELOPMENT_TOOLING.md`.
- Use Context7 for current library docs when working with unfamiliar or version-sensitive APIs.
- Read the exact versioned Expo docs before making Expo-specific changes:
  https://docs.expo.dev/versions/v54.0.0/
- Prefer Expo-managed configuration in `app.json` unless native folders are intentionally generated.
- Do not commit local secrets, `.env`, signing keys, certificates, provisioning profiles, or generated native folders.
- Keep Android/iOS shared behavior in TypeScript where possible.
- Preserve the product direction: route-based curation for spare time during Gangwon car travel.
- Update `docs/CURRENT_DIRECTION.md` when project priorities or next steps change.
- Update `docs/DEVELOPMENT_STRUCTURE.md` when the app structure meaningfully changes.
- Create a `work_logs/` entry after meaningful code, config, documentation, or product-direction changes. Use `npm run log:new -- "short work title"`.
- Run `npm run typecheck` before handing off code changes.
- Run `npm run check:deps` after adding or changing Expo/RN dependencies.
- Run `npm run check:react` after meaningful React component changes when practical.
- Run Maestro flows after meaningful user-flow/UI changes once a dev build is installed.

## Multi-Desktop Workflow

- Commit source files, config files, and lockfiles.
- Recreate dependencies on each desktop with `npm ci`.
- Use `.env.example` as the template for local `.env` files.
- Use EAS for cloud Android/iOS builds when local native build tools are unavailable.
