# Codex Workflow

This project keeps lightweight working memory in docs and work logs so development can continue across desktops and sessions.

## Before Starting Work

Read the relevant files before changing code:

- `AGENTS.md`
- `docs/CURRENT_DIRECTION.md`
- `docs/PROJECT_BRIEF.md`
- `docs/PRODUCT_FLOW.md`
- `docs/DEVELOPMENT_STRUCTURE.md`
- `docs/DEVELOPMENT_TOOLING.md`

For focused tasks, read only the relevant documents. For product or architecture decisions, read all of them.

## During Work

- Keep changes scoped to the user request.
- Prefer project conventions over new abstractions.
- Update `docs/CURRENT_DIRECTION.md` when priorities, assumptions, or next steps change.
- Update `docs/DEVELOPMENT_STRUCTURE.md` when the app structure meaningfully changes.
- Add or update product docs when a request clarifies the intended feature flow.
- Use Context7 for current documentation when changing version-sensitive library code.
- Use React Doctor as an advisory check for meaningful React code changes.
- Use Maestro flows after UI/user-flow changes when an Android or iOS build is available.

## After Meaningful Changes

Create a work log in `work_logs/`.

Use:

```powershell
npm run log:new -- "short work title"
```

Then fill in the generated file with:

- user request
- context docs consulted
- summary of work
- changed files
- verification commands and results
- decisions made
- follow-ups

For tiny conversational answers with no file changes, a work log is not required.

## Tooling Checks

Useful commands:

```powershell
npm run check:react
npm run maestro:version
npm run test:e2e
```

`test:e2e` requires a compatible app build installed on a connected emulator/device.

## Handoff Standard

A future developer or Codex session should be able to answer:

- What was the last direction?
- What changed?
- Why did it change?
- What should happen next?
- What verification already ran?
