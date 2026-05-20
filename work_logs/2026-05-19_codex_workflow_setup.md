# 2026-05-19 - Codex Workflow Setup

## Request

Set up a project workflow similar to the existing Unreal-side workflow: keep code-change logs, maintain a current direction file, preserve development structure docs, and make Codex refer to the right project documents during future work.

## Context Docs Consulted

- `AGENTS.md`
- `docs/PROJECT_BRIEF.md`
- `docs/PRODUCT_FLOW.md`

## Summary

- Added the current project direction document.
- Added the development structure guide.
- Added the Codex workflow guide.
- Added the work log folder and log conventions.
- Added a cross-platform Node script for creating new work log files.
- Updated `AGENTS.md` and `README.md` so future work uses these documents as the project operating layer.

## Changed Files

- `docs/CURRENT_DIRECTION.md`
- `docs/DEVELOPMENT_STRUCTURE.md`
- `docs/CODEX_WORKFLOW.md`
- `work_logs/README.md`
- `work_logs/2026-05-19_codex_workflow_setup.md`
- `tools/logging/new-work-log.mjs`
- `package.json`
- `AGENTS.md`
- `README.md`

## Verification

- `npm run typecheck` passed.
- `node --check tools/logging/new-work-log.mjs` passed.

## Decisions

- Use `work_logs/` for human-readable handoff logs.
- Use `docs/CURRENT_DIRECTION.md` as the first place to check current priorities.
- Use a Node-based log generator rather than a PowerShell-only script so the workflow can travel across desktops and operating systems.

## Follow-Ups

- Use this workflow for the next feature implementation.
- Update current direction after routing and initial app structure are chosen.
