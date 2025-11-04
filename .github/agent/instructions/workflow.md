# Canonical Agent Workflow

1) **Bootstrap / Update**
- Ensure `template/` compiles (`pnpm i && pnpm start` locally).
- If not a full project yet, initialize from `template/` into working repo.

2) **Quality Gates**
- Run `pnpm run lint`, `pnpm run test:ci`, and (optionally) `pnpm run e2e:ci`.
- Fix any errors before proceeding.

3) **Feature Tasks (examples)**
- Add a new feature module under `src/app/features/<name>`
- Use TanStack Query for data fetching and caching.
- Implement a typed reactive form using Angular 20 **Typed Forms** and **zod** validation.
- If behavior-only UI is needed, extend primitives under `src/app/ui` (dialog/menu/popover).

4) **A11y & Testing**
- Add keyboard nav tests for interactive components.
- Add `axe` smoke tests via Playwright for primitives.

5) **Docs & ADRs**
- Update `docs/PRIMITIVES.md` and `docs/DECISIONS.md` with any API or architecture change.

6) **PR**
- Open a PR with a clear title and description (why, how, tests, docs links).

## Task Checklist
- [ ] Typed Forms only; no `any` or implicit `unknown`
- [ ] Signals for local state; no overuse of global stores
- [ ] HTTP interceptors typed; errors mapped to domain-safe types
- [ ] Keyboard & screen-reader paths tested for primitives
- [ ] CI is green
