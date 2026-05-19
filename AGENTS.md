# Codex Project Guide

This project is an Expo + React Native + TypeScript app.

## Baseline

- Expo SDK: 54
- React Native: 0.81
- React: 19.1
- Node.js: use the version in `.nvmrc` / `.node-version`
- Package manager: npm with `package-lock.json`

## Working Rules

- Read the exact versioned Expo docs before making Expo-specific changes:
  https://docs.expo.dev/versions/v54.0.0/
- Prefer Expo-managed configuration in `app.json` unless native folders are intentionally generated.
- Do not commit local secrets, `.env`, signing keys, certificates, provisioning profiles, or generated native folders.
- Keep Android/iOS shared behavior in TypeScript where possible.
- Run `npm run typecheck` before handing off code changes.
- Run `npm run check:deps` after adding or changing Expo/RN dependencies.

## Multi-Desktop Workflow

- Commit source files, config files, and lockfiles.
- Recreate dependencies on each desktop with `npm ci`.
- Use `.env.example` as the template for local `.env` files.
- Use EAS for cloud Android/iOS builds when local native build tools are unavailable.
