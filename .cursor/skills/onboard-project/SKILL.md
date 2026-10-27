---
name: onboard-project
description: Onboards the Virtual Engineering Team into a repository by inspecting stack, tests, and conventions, then writing PROJECT_CONTEXT.md and ARCHITECTURE.md. Use when entering an unfamiliar project or when the user says onboard, inspect this repo, or set up the team here.
---

# Onboard a project

1. Confirm the workspace path. If this is the wrong folder, stop.
2. Run `node /Users/jasonhalim/Documents/virtual-engineering-team/bin/vet.js onboard .` when `.agent-team/` is missing.
3. Inspect only what you need:
   - Top-level files
   - Package/manifest and scripts
   - App entry points
   - UI/design system clues
   - Test command
   - Existing rules/docs
   - Git status
4. Write verified facts to `.agent-team/PROJECT_CONTEXT.md` and `.agent-team/ARCHITECTURE.md`.
5. Label unknowns as unknowns. Do not invent.
6. Do not scan every file.
