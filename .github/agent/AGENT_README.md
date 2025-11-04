# Angular 20 Template — Agent Pack

This pack contains everything a coding agent needs to scaffold and evolve an **Angular 20 + Tailwind 4** project
with strongly-typed patterns, headless primitives, and CI. Use the instructions and tasks below to open PRs
with minimal human guidance.

## Contents
- `agent/instructions/system_prompt.md` — guardrails and preferences for code generation
- `agent/instructions/workflow.md` — canonical workflow & task checklist
- `agent/instructions/checklists.md` — linting, testing, a11y & review gates
- `agent/context/links.md` — curated docs and references
- `docs/*` — human-readable objectives, architecture, ADRs, primitives
- `template/*` — minimal Angular 20 scaffold with typed examples & primitives
- `.github/workflows/ci.yml` — CI pipeline for lint/test/build

## How to Use (for a coding agent)
1. Read `agent/instructions/system_prompt.md`.
2. Follow `agent/instructions/workflow.md` step-by-step.
3. Create a new branch and propose changes as a PR.
4. Ensure all items in `agent/instructions/checklists.md` pass before completion.
