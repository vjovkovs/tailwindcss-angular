# Checklists

## Lint & Types
- [ ] `tsconfig.json` has `strict: true`, `noUncheckedIndexedAccess: true`
- [ ] ESLint passes with no warnings

## Testing
- [ ] Unit tests cover behavior and edge cases
- [ ] Testing Library asserts against roles/labels, not classes
- [ ] Playwright + `@axe-core/playwright` has 0 violations for primitives

## A11y
- [ ] Focus is trapped in dialogs; escape closes; initial focus set
- [ ] Roving tab index in menus with ArrowUp/Down, Home/End, and Typeahead
- [ ] Correct ARIA roles/attributes applied

## Docs
- [ ] Updated `docs/PRIMITIVES.md` usage examples
- [ ] ADR added/edited in `docs/DECISIONS.md`
