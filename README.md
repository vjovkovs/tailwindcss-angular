# Angular + Tailwind Template (v1)

A production-ready starter for **Angular 20 + Tailwind CSS 4**.

## Overview

This template provides a complete, opinionated foundation for building modern Angular applications with Tailwind CSS, featuring:

- **Angular 20** with Standalone Components, Signals, and Typed Forms
- **Tailwind CSS 4** for utility-first styling
- **TanStack Query/Table** for data fetching and table management
- **Zod** for runtime validation
- **Headless UI Primitives** (Dialog, Popover, Menu) built with Angular CDK
- **Testing Infrastructure**: Vitest + Testing Library + Playwright + axe
- **CI/CD**: GitHub Actions with quality gates

## Objectives

### Problem
Teams repeatedly rebuild structure, data access, forms, a11y, and CI from scratch.

### Objective (v1)
Deliver an **Angular 20 + Tailwind 4** template that:
1. Standardizes architecture/tooling
2. Ships minimal headless primitives (Dialog, Popover, Menu)
3. Demonstrates TanStack Query/Table + Typed Forms + Zod
4. Bakes in quality gates (ESLint/Prettier/Vitest/axe/CI)

### Scope (v1)
- App shell (responsive, keyboard navigable)
- Auth-ready route guards (MSAL-ready)
- Data utils: query client wrapper, interceptors, error mapping
- Forms: Typed Forms + Zod validation
- Headless: Dialog, Popover, Menu
- Tests: Vitest + Testing Library; Playwright + axe
- CI: GitHub Actions

### Success Metrics
- Feature page in ≤ N hours
- Lighthouse ≥ 90
- 0 axe violations on primitives
- One real app bootstrapped and deployed

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Navigate to `http://localhost:4200/`. The app will automatically reload on file changes.

### Build

Build the project for production:

```bash
npm run build
```

Build artifacts will be in the `dist/` directory.

### Testing

Run unit tests:

```bash
npm run test
```

Run e2e tests:

```bash
npm run test:e2e
```

Run accessibility tests:

```bash
npm run test:a11y
```

## Architecture

### Stack
- **Angular 20** (Standalone APIs, Signals, Typed Forms)
- **Tailwind CSS 4** (utility-first styling)
- **TanStack Query/Table** (data fetching & tables)
- **Zod** (runtime validation)
- **Angular CDK** (Overlay, Focus management, A11y)
- **Vitest + @testing-library/angular** (unit tests)
- **Playwright + axe-core** (e2e & a11y tests)
- **GitHub Actions** (CI/CD)

### Project Structure

```
src/
  app/
    core/              # Core services, interceptors, guards
      http/            # HTTP client wrappers
      query/           # TanStack Query setup
      auth/            # Auth guards and services
    shared/            # Shared utilities and helpers
      validators/      # Zod schemas
      utils/           # Helper functions
    ui/                # Headless UI primitives
      dialog/          # Dialog component
      popover/         # Popover component
      menu/            # Menu component
    features/          # Feature modules
      example/         # Example feature
  styles/              # Global styles
    tailwind/          # Tailwind configuration
```

### Design Patterns

- **Signals** for local state management
- **TanStack Query** for server state and caching
- **Typed HTTP clients** with interceptors
- **Zod schemas** bound to Typed Forms
- **CDK Overlay/Focus** for headless primitives

## Headless UI Primitives

### Dialog
- Escape to close, focus trap, return focus on close
- Slots: trigger, overlay, content, title, close
- Full keyboard navigation and screen reader support

### Popover
- CDK Overlay positioning
- Flexible trigger and content slots
- Accessible with proper ARIA attributes

### Menu
- Roving tabindex for keyboard navigation
- Arrow Up/Down, Home/End keys
- Type-ahead search
- Accessible menu button pattern

## Decision Log (ADRs)

### ADR-001: Template-first + Minimal Headless
**Decision**: Ship Dialog/Popover/Menu only; extract to library later if reused across projects.

**Rationale**: Avoid premature abstraction. Keep primitives co-located with the app until patterns stabilize.

### ADR-002: TanStack Query/Table
**Decision**: Use TanStack Query for data fetching and TanStack Table for table management.

**Rationale**: Framework-agnostic, well-tested, excellent DX. Provides caching, optimistic updates, and pagination out of the box.

### ADR-003: Zod + Typed Forms
**Decision**: Runtime validation via Zod + Angular 20 Typed Forms.

**Rationale**: Type safety at compile time (Typed Forms) + runtime safety (Zod). Single source of truth for validation logic.

## Curated References

- [Angular 20 Docs](https://angular.dev/)
- [Angular CDK & A11y](https://material.angular.io/cdk/categories)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [TanStack Query (Angular)](https://tanstack.com/query/latest/docs/angular/overview)
- [TanStack Table](https://tanstack.com/table/latest)
- [Zod](https://zod.dev/)
- [Testing Library for Angular](https://testing-library.com/docs/angular-testing-library/intro/)
- [Playwright](https://playwright.dev/)
- [axe-core (Playwright)](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)

## License

MIT
