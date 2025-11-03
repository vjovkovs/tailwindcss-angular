# Contributing to Angular + Tailwind Template

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites
- Node.js 18+
- npm 9+

### Getting Started

1. Clone the repository
```bash
git clone <repository-url>
cd angular-tailwind-template
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

## Development Workflow

### Code Style

We use ESLint and Prettier to maintain code quality and consistency:

```bash
# Check linting
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

### Testing

#### Unit Tests
We use Vitest and Testing Library for unit tests:

```bash
npm run test
```

#### E2E Tests
We use Playwright for end-to-end testing:

```bash
npm run test:e2e
```

#### Accessibility Tests
Run accessibility tests with axe-core:

```bash
npm run test:a11y
```

### Building

```bash
npm run build
```

## Project Structure

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

## Creating New Components

### Headless UI Components

When creating new headless UI components, follow these principles:

1. **Accessibility First**: Use Angular CDK for overlay and focus management
2. **Keyboard Navigation**: Implement full keyboard support
3. **ARIA Attributes**: Add proper ARIA roles and attributes
4. **Focus Management**: Trap focus when needed, restore on close

Example:
```typescript
import { Component } from '@angular/core';
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';

@Component({
  // Component implementation
})
export class MyComponent {
  // Use CDK utilities
}
```

### Feature Components

1. Use standalone components
2. Implement Typed Forms with Zod validation
3. Use TanStack Query for data fetching
4. Apply Tailwind CSS for styling

## Forms and Validation

### Using Zod with Typed Forms

```typescript
import { FormControl, FormGroup } from '@angular/forms';
import { z } from 'zod';
import { zodValidator } from './shared/utils/form.utils';

// Define schema
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

// Create form
const form = new FormGroup({
  email: new FormControl('', zodValidator(schema.shape.email)),
  name: new FormControl('', zodValidator(schema.shape.name)),
});
```

## Data Fetching with TanStack Query

```typescript
import { injectQuery } from '@tanstack/angular-query-experimental';
import { ApiService } from './core/http/api.service';

export class MyComponent {
  private apiService = inject(ApiService);

  query = injectQuery(() => ({
    queryKey: ['users'],
    queryFn: () => this.apiService.get('/users'),
  }));
}
```

## Styling Guidelines

### Tailwind CSS

- Use Tailwind utility classes for styling
- Avoid custom CSS when possible
- Use the theme configuration in `src/styles/tailwind/theme.css`
- Follow mobile-first responsive design

### Component Styles

- Keep component-specific styles minimal
- Use HostBinding for simple styles
- Create directives for reusable style patterns

## Git Workflow

1. Create a feature branch
```bash
git checkout -b feature/my-feature
```

2. Make your changes and commit
```bash
git add .
git commit -m "feat: add new feature"
```

3. Push and create a pull request
```bash
git push origin feature/my-feature
```

### Commit Message Convention

We follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Request review from maintainers
4. Address review feedback
5. Squash commits if needed

## Questions?

If you have questions, please open an issue or reach out to the maintainers.

Thank you for contributing!
