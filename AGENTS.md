# Asteroids Agent Guide

## Project

This is a standalone JavaScript game. Use Node.js 24 and npm.
Read README.md for launch commands and docs/missions.md for mission changes.
Before editing src/game/, read src/game/AGENTS.md.

- Keep simulation in src/game/ independent of the DOM, Canvas and wall-clock time.
- Keep mission presets separate; the catalog discovers JSON files automatically.
- Use npm ci with the committed lockfile and public registry in .npmrc.
- Keep changes scoped to the task and preserve other contributors' work.

## Verification

- npm test: deterministic simulation and mission contracts.
- npm run build: production bundle.
- npm run test:e2e: Chromium UI scenarios; install Chromium as described in README.
- Run checks relevant to the changed behavior. For a PR, run npm run check;
  run browser tests when gameplay or UI behavior changes.
- Test-only state controls must stay absent from production builds.
- Report actual commands and outcomes, including any checks that could not run.

## GitHub

- main accepts changes through PRs with passing CI.
- Commit, push and PR operations must be covered by the user's request.
  Do not ask again when the request already authorizes the operation.
- Student PRs require current approval from @KalininVD.
- A review bypass may be used only for PRs authored by KalininVD and only
  when their merge is authorized. CI must pass for the exact PR revision.
- Read CONTRIBUTING.md before publishing or resolving a merge conflict.

## Agent configuration

Tracked .agents/, .codex/ and .claude/ files are shared project configuration.
Keep personal settings, credentials, sessions and caches out of commits.
Instructions guide the agent; GitHub rules and runtime permissions enforce
their own boundaries. Shell rules do not control MCP tool calls.
