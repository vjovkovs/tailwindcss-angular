# API Code Generation with @hey-api/openapi-ts

This document explains how to use @hey-api/openapi-ts to automatically generate type-safe API clients with Zod validation and TanStack Query hooks.

## Overview

The project uses `@hey-api/openapi-ts` to automatically generate:

- **TypeScript types** - Strongly-typed interfaces for all API endpoints
- **Zod schemas** - Runtime validation schemas
- **SDK client** - Type-safe API client with automatic validation
- **TanStack Query hooks** - Ready-to-use Angular Query hooks

## Prerequisites

1. An OpenAPI specification file (`openapi.json` or `openapi.yaml`)
2. `@hey-api/openapi-ts` installed (already in `devDependencies`)
3. `zod` installed (already in `dependencies`)

## Configuration

The generator is configured in `openapi-ts.config.js`:

```javascript
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi.json',  // Your OpenAPI spec file
  output: {
    format: 'prettier',     // Format with Prettier
    lint: 'eslint',         // Lint with ESLint
    path: './src/app/core/api/generated'  // Output directory
  },
  plugins: [
    '@hey-api/schemas',     // Export schemas
    {
      dates: true,          // Transform ISO date strings to Date objects
      name: '@hey-api/transformers',
    },
    {
      enums: 'javascript',  // Use JavaScript enums (not TypeScript enums)
      name: '@hey-api/typescript',
    },
    {
      name: '@hey-api/sdk',
      validator: 'zod',     // Generate Zod schemas for validation
      transformer: true,    // Apply date transformations
    },
    '@tanstack/angular-query-experimental'  // Generate TanStack Query hooks
  ],
});
```

### Key Configuration Options

- **`validator: 'zod'`** - Generates Zod schemas for runtime validation
- **`dates: true`** - Converts ISO date strings to JavaScript Date objects
- **`transformer: true`** - Applies transformers to SDK methods
- **`enums: 'javascript'`** - Uses const objects instead of TypeScript enums

## Usage

### 1. Obtain Your OpenAPI Specification

Place your OpenAPI spec file in the project root:

```bash
# Download from your API
curl https://localhost:53928/swagger/v1/swagger.json > openapi.json

# Or use a local file
cp path/to/api-spec.json openapi.json
```

### 2. Generate API Client

Run the generator:

```bash
npm run generate:api
```

This will generate files in `src/app/core/api/generated/`:

```
src/app/core/api/generated/
├── client/               # HTTP client utilities
├── core/                 # Core utilities (auth, params, serializers)
├── types.gen.ts          # TypeScript types
├── sdk.gen.ts            # SDK methods
├── client.gen.ts         # Client configuration
└── index.ts              # Exports
```

### 3. Configure the Client

In your Angular app, configure the base URL:

```typescript
// src/app/core/api/api-client.config.ts
import { client } from '@core/api/generated';
import { environment } from '@env/environment';

export function configureApiClient() {
  client.setConfig({
    baseUrl: environment.apiUrl,
  });
}

// Call this in app.config.ts or main.ts
```

### 4. Use the Generated SDK

```typescript
import { Component, inject, signal } from '@angular/core';
import { AuditsService } from '@core/api/generated';

@Component({
  selector: 'app-audits',
  template: `
    @if (loading()) {
      <p>Loading...</p>
    } @else if (error()) {
      <p>Error: {{ error() }}</p>
    } @else {
      <ul>
        @for (audit of audits(); track audit.id) {
          <li>{{ audit.auditNumber }} - {{ audit.supplierName }}</li>
        }
      </ul>
    }
  `
})
export class AuditsComponent {
  audits = signal<Audit[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  async ngOnInit() {
    this.loading.set(true);
    try {
      const response = await AuditsService.getAudits({
        pageNumber: 1,
        pageSize: 20
      });

      // Response is automatically validated with Zod!
      this.audits.set(response.data.items);
    } catch (err) {
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }
}
```

### 5. Use with TanStack Query (Recommended)

The generated code includes TanStack Query hooks:

```typescript
import { Component } from '@angular/core';
import { injectAuditsQuery } from '@core/api/generated';

@Component({
  selector: 'app-audits',
  template: `
    @if (auditsQuery.isPending()) {
      <p>Loading...</p>
    } @else if (auditsQuery.isError()) {
      <p>Error: {{ auditsQuery.error().message }}</p>
    } @else {
      <ul>
        @for (audit of auditsQuery.data().items; track audit.id) {
          <li>{{ audit.auditNumber }}</li>
        }
      </ul>
    }
  `
})
export class AuditsComponent {
  // Automatically fetches, caches, and provides loading/error states
  auditsQuery = injectAuditsQuery({
    pageNumber: 1,
    pageSize: 20
  });
}
```

## Generated Files Explained

### types.gen.ts

Contains all TypeScript interfaces:

```typescript
export type AuditDetailsResponse = {
  auditNumber?: string | null;
  supplierNumber?: string | null;
  supplierName?: string | null;
  auditDate?: string | null;
  isClosed?: boolean;
};

export type PaginatedResponseOfAuditDetailsResponse = {
  items?: Array<AuditDetailsResponse>;
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
};
```

### sdk.gen.ts

Contains SDK methods with Zod validation:

```typescript
export class AuditsService {
  /**
   * Get all audits with pagination
   * @param data Request parameters
   * @returns Paginated audit response
   */
  public static getAudits(
    data: GetAuditsData
  ): Promise<GetAuditsResponse> {
    // Validates request and response with Zod
    return client.request({
      method: 'GET',
      url: '/api/Audits',
      query: data.query,
    });
  }
}
```

### Zod Schemas

With `validator: 'zod'`, Zod schemas are automatically generated:

```typescript
import { z } from 'zod';

export const AuditDetailsResponseSchema = z.object({
  auditNumber: z.string().nullable().optional(),
  supplierNumber: z.string().nullable().optional(),
  supplierName: z.string().nullable().optional(),
  auditDate: z.string().nullable().optional(),
  isClosed: z.boolean().optional(),
});

export const PaginatedResponseSchema = z.object({
  items: z.array(AuditDetailsResponseSchema).optional(),
  totalCount: z.number().optional(),
  pageNumber: z.number().optional(),
  pageSize: z.number().optional(),
});
```

## Authentication

To add authentication headers, configure an interceptor:

```typescript
// src/app/core/api/api-client.config.ts
import { client } from '@core/api/generated';

export function configureApiClient() {
  // Add interceptor for authentication
  client.interceptors.request.use((config) => {
    const token = getAccessToken(); // Your auth logic
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.setConfig({
    baseUrl: environment.apiUrl,
  });
}
```

For MSAL integration, use Angular's HTTP interceptor (already configured in this project).

## Regenerating After API Changes

Whenever your API changes:

1. Update your `openapi.json` file
2. Run `npm run generate:api`
3. Review the changes in `src/app/core/api/generated/`
4. Update any components using modified endpoints

**Note:** Generated files are tracked in git (see `d32f61e Added Generated Files` commit). This allows team members to see API changes in pull requests.

## Workflow

### Development Workflow

```bash
# 1. API developer updates the API
# 2. Download new OpenAPI spec
curl https://localhost:53928/swagger/v1/swagger.json > openapi.json

# 3. Regenerate client
npm run generate:api

# 4. Review changes
git diff src/app/core/api/generated/

# 5. Fix any breaking changes in your code
# 6. Test
npm run test

# 7. Commit
git add openapi.json src/app/core/api/generated/
git commit -m "chore: update API client to match latest spec"
```

### CI/CD Integration

Add a step to your CI pipeline to verify the generated code is up-to-date:

```yaml
# .github/workflows/ci.yml
- name: Verify API client is up-to-date
  run: |
    npm run generate:api
    git diff --exit-code src/app/core/api/generated/ || \
      (echo "API client is out of date. Run 'npm run generate:api'" && exit 1)
```

## Advantages Over Manual Services

### Before (@hey-api)
- ❌ Manually write TypeScript interfaces
- ❌ Manually write Zod schemas
- ❌ Manually write HTTP service methods
- ❌ Keep everything in sync with API changes
- ❌ No guarantee of type safety at runtime

### After (@hey-api)
- ✅ Types automatically generated from OpenAPI spec
- ✅ Zod schemas automatically generated
- ✅ SDK methods automatically generated
- ✅ TanStack Query hooks automatically generated
- ✅ Single source of truth (OpenAPI spec)
- ✅ Runtime validation out of the box
- ✅ Regenerate in seconds when API changes

## Troubleshooting

### "No Zod schemas generated"

**Problem:** Generated files don't import or use Zod.

**Solution:** Ensure `openapi-ts.config.js` has:
```javascript
{
  name: '@hey-api/sdk',
  validator: 'zod',  // ← This line is required
  transformer: true,
}
```

### "Cannot find module './openapi.json'"

**Problem:** The OpenAPI spec file doesn't exist.

**Solution:** Download or create your OpenAPI spec:
```bash
curl https://your-api.com/swagger.json > openapi.json
```

### "Generated code has linting errors"

**Problem:** Generated code doesn't match your ESLint config.

**Solution:**
1. Update ESLint config to allow generated code patterns
2. Or disable linting for generated files:
```javascript
// openapi-ts.config.js
output: {
  lint: false,  // Disable linting
}
```

### "Types don't match API responses"

**Problem:** OpenAPI spec is out of sync with actual API.

**Solution:**
1. Ensure you're using the latest OpenAPI spec
2. Contact API developers to fix the spec
3. As a temporary workaround, manually edit types.gen.ts (but this will be overwritten on next generation)

## Migration from Manual Services

If you have existing manual services:

### Step 1: Generate the client
```bash
npm run generate:api
```

### Step 2: Compare interfaces
Check if your manual types match generated types:
```typescript
// Old: src/app/core/api/models/audit.ts
export interface Audit { ... }

// New: src/app/core/api/generated/types.gen.ts
export type AuditDetailsResponse = { ... }
```

### Step 3: Update imports
Replace manual imports with generated imports:
```typescript
// Before
import { Audit } from '@core/api/models';
import { AuditsService } from '@core/api/services';

// After
import { AuditDetailsResponse } from '@core/api/generated';
import { AuditsService } from '@core/api/generated';
```

### Step 4: Update service calls
Replace manual HTTP calls with SDK methods:
```typescript
// Before
this.http.get<Audit[]>('/api/Audits').subscribe(audits => {
  // No validation
});

// After
const response = await AuditsService.getAudits();
// Automatically validated with Zod!
```

### Step 5: Remove old files
Once everything is working:
```bash
rm -rf src/app/core/api/models/
rm -rf src/app/core/api/services/
# Keep schemas if you have custom validation
```

## Best Practices

1. **Commit generated files** - Track them in git so team members see API changes
2. **Review diffs carefully** - When regenerating, check what changed
3. **Keep OpenAPI spec up-to-date** - It's your single source of truth
4. **Use Zod validation** - Always enable `validator: 'zod'` for runtime safety
5. **Use TanStack Query** - Leverage the generated hooks for caching and state management
6. **Don't edit generated files** - They'll be overwritten. Create wrapper services if needed
7. **Document your OpenAPI spec** - Descriptions become JSDoc comments in generated code

## References

- [@hey-api/openapi-ts Documentation](https://heyapi.vercel.app/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Zod Documentation](https://zod.dev/)
- [TanStack Query Angular](https://tanstack.com/query/latest/docs/angular/overview)

## Related Documentation

- [API Services with TanStack Query](./API_SERVICES_TANSTACK_QUERY.md) - How to use the generated code
- [NUPIC API Integration](./NUPIC_API_INTEGRATION.md) - NUPIC-specific API setup
