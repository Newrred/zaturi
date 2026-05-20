# 2026-05-19 16:36 KST - tooling setup context7 maestro react doctor

## Request

- Install or set up Context7, Maestro, and react-doctor if useful.
- Research additional permissive-license open source libraries that could help implement the actual app.

## Context Docs Consulted

- `AGENTS.md`
- `docs/CURRENT_DIRECTION.md`
- `docs/CODEX_WORKFLOW.md`
- Official Context7, Maestro, and react-doctor documentation/GitHub pages.

## Summary

- Registered Context7 as a global Codex MCP server.
- Installed Maestro CLI 2.5.1 under the user profile and added it to the user PATH.
- Installed `react-doctor@0.2.1` as a dev dependency.
- Installed the react-doctor Codex skill into the user Codex skills directory.
- Added project scripts for React Doctor and Maestro.
- Added an initial Maestro smoke flow.
- Added `docs/DEVELOPMENT_TOOLING.md` with installed tooling notes and permissive-license OSS candidates.
- Updated project workflow docs so future Codex work knows when to use the tools.

## Changed Files

- `package.json`
- `package-lock.json`
- `maestro/flows/smoke.yaml`
- `docs/DEVELOPMENT_TOOLING.md`
- `docs/CURRENT_DIRECTION.md`
- `docs/CODEX_WORKFLOW.md`
- `AGENTS.md`
- `README.md`
- `work_logs/2026-05-19_1636_tooling-setup-context7-maestro-react-doctor.md`

External user-level changes:

- Codex MCP server `context7` added globally.
- Maestro installed at `C:\Users\hongs\.maestro\cli-2.5.1\maestro`.
- User PATH updated with Maestro `bin`.
- React Doctor Codex skill installed at `C:\Users\hongs\.codex\skills\react-doctor\SKILL.md`.

## Verification

- `codex mcp get context7` passed.
- `npm run typecheck` passed.
- `npm run check:react` passed. React Doctor found no issues in offline mode.
- `npm run maestro:version` passed with Maestro 2.5.1 when current process PATH/JAVA_HOME were set.
- `npm run check:deps` passed.
- `npx --yes expo-doctor@latest` passed, 17/17 checks.
- `npm audit --audit-level=high` passed with no high severity issues. Existing Expo transitive `postcss` moderate advisory remains; forced fix would downgrade/break Expo.

## Decisions

- Context7 is configured without an API key for now. Add an API key later only if rate limits become an issue.
- React Doctor is advisory because version 0.2.1 declares `node >=22`, while this Expo project currently recommends Node 20.20.1. It still ran successfully under Node 20.20.1 in offline mode.
- Maestro E2E testing is configured but the smoke flow requires a dev/production app build with app id `com.zaturi.app` installed on a device or emulator.
- Additional app libraries were researched and documented, but not installed yet. They should be adopted only when the relevant implementation step begins.

## Follow-Ups

- Restart or open a new Codex session if Context7 tools or the new react-doctor skill do not appear in the active tool/skill list.
- Reopen PowerShell/VS Code terminals so the Maestro PATH update is inherited.
- Build and install an Android dev client before running `npm run test:e2e`.
- Install `expo-router` next when starting the app screen structure.
