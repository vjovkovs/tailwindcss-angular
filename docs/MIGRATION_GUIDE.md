# Migration Guide: Manual API Code → Generated Code

This guide will walk you through migrating from manual API services to fully using the generated OpenAPI code.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Migration Scripts](#migration-scripts)
- [Step-by-Step Migration](#step-by-step-migration)
- [Handling Custom Logic](#handling-custom-logic)
- [Troubleshooting](#troubleshooting)
- [Rollback Instructions](#rollback-instructions)

---

## Overview

### Current State

Your codebase currently has:
- ✅ **Generated code** (4,784 lines) - types, SDK, TanStack Query hooks
- ✅ **Manual code** (1,700+ lines) - models, schemas, services
- ❌ **No integration** - application uses manual code, generated code is unused

### Target State

After migration:
- ✅ **Generated code** - fully integrated and used throughout the application
- ✅ **Custom transformers** - for business logic (e.g., supplier data transformation)
- ❌ **No manual code** - removed after successful migration

### Benefits

- 🚀 **80% less code** - auto-generated from OpenAPI spec
- 🔄 **One command sync** - `npm run generate:api` updates everything
- ✅ **Type safety** - from API to UI
- 🛡️ **Runtime validation** - automatic Zod validation
- 📚 **Always up-to-date** - generated from source of truth

---

## Prerequisites

### 1. OpenAPI Spec File

Ensure you have the OpenAPI specification file:

```bash
# Check if file exists
ls -la openapi-updated.json

# If not, download from your backend
curl https://localhost:53928/swagger/v1/swagger.json > openapi-updated.json

# Verify it's valid JSON
cat openapi-updated.json | jq '.info.title'
```

### 2. Generate Latest Code

Regenerate the API client with your current spec:

```bash
npm run generate:api
```

### 3. Create Backup

```bash
# Create a git branch for the migration
git checkout -b feature/migrate-to-generated-api

# Or create a manual backup
cp -r src src.backup
```

---

## Migration Scripts

Four automated scripts to help with migration:

### 1. `migrate-analyze.js`

Analyzes your codebase and creates a migration plan.

```bash
node scripts/migrate-analyze.js
```

**Output:**
- `.migration/migration-plan.json` - Detailed migration plan
- `.migration/migration-report.md` - Human-readable report

### 2. `migrate-execute.js`

Executes the migration automatically.

```bash
# Preview changes (dry run)
node scripts/migrate-execute.js --dry-run

# Execute migration
node scripts/migrate-execute.js

# Migrate specific file only
node scripts/migrate-execute.js --file src/app/features/suppliers/suppliers-table.component.ts
```

**What it does:**
- Replaces imports from `@core/api/models` → `@core/api/generated`
- Replaces imports from `@core/api/schemas` → `@core/api/generated` (Zod schemas)
- Removes service injections
- Replaces service method calls with generated query options
- Adds necessary imports (`injectQuery`, `injectMutation`)
- Creates backups in `.migration/backup/`

### 3. `migrate-validate.js`

Validates the migration was successful.

```bash
node scripts/migrate-validate.js
```

**Checks:**
- ✅ No remaining manual imports
- ✅ All generated imports are valid
- ✅ TypeScript compilation succeeds
- ✅ Identifies unused manual code

### 4. `cleanup-manual-code.js`

Removes manual code that's no longer needed.

```bash
# Preview what will be deleted
node scripts/cleanup-manual-code.js --dry-run

# Execute cleanup
node scripts/cleanup-manual-code.js
```

---

## Step-by-Step Migration

### Step 1: Analyze Current Codebase

```bash
node scripts/migrate-analyze.js
```

Review the output:
- Check `.migration/migration-report.md`
- Note files with "complex" migrations
- Identify custom logic that needs special handling

**Example Output:**
```
📊 Migration Summary:
   ✓ Total files to migrate: 14
   ✓ Components to update: 4
   ✓ Types to replace: 32
   ⚠ Complex migrations: 2

⚠️  Warnings:
   - src/app/features/suppliers/suppliers-table.component.ts: Contains custom transformation logic
```

---

### Step 2: Preview Migration (Dry Run)

```bash
node scripts/migrate-execute.js --dry-run
```

Review what will change:
- Import statements
- Service method calls
- Type references

**Example Output:**
```
📝 Migrating: src/app/features/audits/audits-table.component.ts
   Changes:
     - Updated import from models: AuditResponse
     - Removed service import: AuditsService
     - Removed inject statement
     - Added TanStack Query imports
     - Added generated imports: auditsGetAllAuditsOptions
     - Replaced: auditsService.getAllAuditsQuery()
   👀 Dry run - no changes written
```

---

### Step 3: Execute Migration

```bash
node scripts/migrate-execute.js
```

The script will:
1. Create backups of all modified files
2. Update imports
3. Replace service calls
4. Add necessary dependencies

**Backups are saved to:** `.migration/backup/`

---

### Step 4: Handle Custom Logic

#### Supplier Data Transformation

The supplier data requires custom transformation. Use the provided transformer:

**Before (Manual):**
```typescript
import { SupplierDetailsResponseSchema } from '@core/api/schemas';
// Schema had custom transformation logic
```

**After (Generated + Transformer):**
```typescript
import type { SupplierDetailsResponse } from '@/core/api/generated';
import { transformSupplierData, type SupplierViewModel } from '@/core/api/transformers/supplier-transformer';

// In your component
private suppliersQuery = injectQuery(() =>
  referenceSuppliersGetAllSuppliersOptions({ query: { pageSize: 100 } })
);

suppliers = computed(() => {
  const data = this.suppliersQuery.data();
  if (!data?.items) return [];

  // Transform raw API data to view models with computed fields
  return transformSupplierData(data.items);
});
```

The transformer provides:
- `hasContact` - boolean
- `hasEmail` - boolean
- `location` - formatted string "City, State"
- `auditCount` - number of audits

#### Other Custom Logic

For other custom validation or transformation:

1. Create a transformer in `src/app/core/api/transformers/`
2. Use generated types as input
3. Return extended view models with computed fields

---

### Step 5: Validate Migration

```bash
node scripts/migrate-validate.js
```

**Check Results:**
- ✅ No manual imports remaining
- ✅ All generated imports valid
- ✅ TypeScript compiles successfully
- ✅ List of unused files to delete

---

### Step 6: Test Application

```bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Start dev server and test manually
npm run dev
```

**Test these features:**
1. Audits table - loading, pagination, search
2. Suppliers table - loading, pagination, search
3. Create/Edit forms - validation, submission
4. File uploads
5. Error handling

---

### Step 7: Review Changes

```bash
# See all changes
git diff

# Review specific file
git diff src/app/features/audits/audits-table.component.ts

# See list of changed files
git status
```

---

### Step 8: Cleanup Manual Code

Once everything works:

```bash
# Preview what will be deleted
node scripts/cleanup-manual-code.js --dry-run

# Execute cleanup
node scripts/cleanup-manual-code.js
```

This removes:
- `src/app/core/api/models/index.ts`
- `src/app/core/api/schemas/index.ts`
- Manual service files (audits, suppliers, etc.)

**Keeps:**
- `base-api.service.ts` (utility methods)
- Generated code
- Custom transformers

---

### Step 9: Commit Changes

```bash
git add .
git commit -m "feat: migrate from manual API services to generated code

- Migrated all components to use generated API client
- Replaced manual models with generated types
- Replaced manual services with TanStack Query options
- Added custom transformers for business logic
- Removed 1,700+ lines of manual code
- Improved type safety and maintainability"
```

---

## Handling Custom Logic

### Pattern 1: Data Transformation

**Use case:** API returns different field names or needs computed fields

**Solution:** Create a transformer

```typescript
// src/app/core/api/transformers/my-transformer.ts
import type { MyApiType } from '@/core/api/generated';

export interface MyViewModel extends MyApiType {
  computedField: string;
}

export function transformMyData(data: MyApiType): MyViewModel {
  return {
    ...data,
    computedField: `${data.field1} - ${data.field2}`,
  };
}
```

### Pattern 2: Custom Validation

**Use case:** Need stricter validation than generated Zod schemas

**Solution:** Create custom Zod schema that wraps generated types

```typescript
import { z } from 'zod';
import type { CreateAuditRequest } from '@/core/api/generated';

export const CreateAuditRequestSchema = z.object({
  auditNumber: z.string().length(5, 'Must be exactly 5 characters'),
  contactEmail: z.string().email('Invalid email format'),
  // ... other fields with strict validation
}) satisfies z.ZodType<CreateAuditRequest>;
```

### Pattern 3: Cache Invalidation

**Use case:** Need complex cache invalidation logic

**Solution:** Use TanStack Query's `queryClient` directly

```typescript
import { injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { auditsCreateAudit } from '@/core/api/generated';

export class MyComponent {
  private queryClient = injectQueryClient();

  createMutation = injectMutation(() => ({
    mutationFn: (data: CreateAuditRequest) => auditsCreateAudit({ body: data }),
    onSuccess: () => {
      // Invalidate related queries
      this.queryClient.invalidateQueries({ queryKey: ['audits'] });
      this.queryClient.invalidateQueries({ queryKey: ['reference-audits'] });
    },
  }));
}
```

---

## Troubleshooting

### Issue: "Cannot find module '@/core/api/generated'"

**Solution:** Update your `tsconfig.json` paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/app/*"],
      "@core/*": ["src/app/core/*"]
    }
  }
}
```

### Issue: "Type X is not assignable to type Y"

**Cause:** Generated types may differ slightly from manual types (e.g., optional vs required)

**Solution:**
1. Check the generated type definition
2. Update your code to match the generated type
3. If needed, create a type adapter:

```typescript
function adaptOldToNew(old: OldType): NewGeneratedType {
  return {
    field1: old.field1 ?? undefined,
    field2: old.field2 ?? undefined,
  };
}
```

### Issue: "Generated code missing expected export"

**Cause:** OpenAPI spec may not include that endpoint

**Solution:**
1. Verify endpoint exists in `openapi-updated.json`
2. Regenerate: `npm run generate:api`
3. If endpoint is missing from spec, contact backend team

### Issue: "Validation failing on valid data"

**Cause:** Generated Zod schemas are strict (or too loose)

**Solution:**
1. Check the generated schema in `zod.gen.ts`
2. Create custom validator if needed (see Pattern 2 above)
3. Transform data before validation if field names differ

### Issue: Migration script failed partway through

**Solution:**
1. Don't panic - backups are in `.migration/backup/`
2. Restore affected file:
   ```bash
   cp .migration/backup/path/to/file.ts src/path/to/file.ts
   ```
3. Fix the issue manually
4. Re-run migration for that file:
   ```bash
   node scripts/migrate-execute.js --file src/path/to/file.ts
   ```

---

## Rollback Instructions

If you need to rollback the migration:

### Option 1: Git Branch (Recommended)

```bash
# Discard all changes
git checkout main

# Or reset to before migration
git reset --hard HEAD~1
```

### Option 2: Manual Restore from Backups

```bash
# Restore all files from backup
cp -r .migration/backup/src/app/* src/app/

# Or restore specific file
cp .migration/backup/src/app/features/audits/audits-table.component.ts \
   src/app/features/audits/audits-table.component.ts
```

### Option 3: Stash Changes

```bash
# Before migration
git stash

# To restore
git stash pop
```

---

## Migration Checklist

Use this checklist to track your progress:

- [ ] Prerequisites
  - [ ] OpenAPI spec file obtained (`openapi-updated.json`)
  - [ ] Generated code is up-to-date (`npm run generate:api`)
  - [ ] Created backup/branch

- [ ] Analysis
  - [ ] Ran `migrate-analyze.js`
  - [ ] Reviewed migration report
  - [ ] Identified complex migrations

- [ ] Migration
  - [ ] Ran `migrate-execute.js --dry-run`
  - [ ] Reviewed preview changes
  - [ ] Ran `migrate-execute.js` (actual migration)
  - [ ] Handled custom logic (transformers)

- [ ] Validation
  - [ ] Ran `migrate-validate.js`
  - [ ] All validation checks passed
  - [ ] TypeScript compiles successfully

- [ ] Testing
  - [ ] Unit tests pass (`npm test`)
  - [ ] E2E tests pass (`npm run test:e2e`)
  - [ ] Manual testing completed
  - [ ] All features working as expected

- [ ] Cleanup
  - [ ] Ran `cleanup-manual-code.js --dry-run`
  - [ ] Reviewed files to delete
  - [ ] Ran `cleanup-manual-code.js`
  - [ ] Manual code removed

- [ ] Finalize
  - [ ] Reviewed all changes (`git diff`)
  - [ ] Committed changes
  - [ ] Updated documentation if needed

---

## Post-Migration Workflow

Once migrated, your workflow becomes:

### When Backend API Changes

```bash
# 1. Get updated OpenAPI spec
curl https://localhost:53928/swagger/v1/swagger.json > openapi-updated.json

# 2. Regenerate client
npm run generate:api

# 3. Review changes
git diff src/app/core/api/generated/

# 4. Update code if breaking changes
# (TypeScript will show errors)

# 5. Test
npm test

# 6. Commit
git add openapi-updated.json src/app/core/api/generated/
git commit -m "chore: update API client to latest spec"
```

### Adding New Features

```bash
# 1. Ensure generated code is up-to-date
npm run generate:api

# 2. Use generated types and query options
import { myNewEndpointOptions } from '@/core/api/generated';

# 3. Add custom transformers if needed
# 4. Build feature using generated code
```

---

## Summary

This migration will:

✅ **Reduce code** by ~1,700 lines (80% reduction)
✅ **Improve type safety** with auto-generated types
✅ **Enable one-command sync** with backend changes
✅ **Maintain custom logic** with transformers
✅ **Preserve existing patterns** (TanStack Query)

**Estimated time:** 1-2 hours for careful migration with testing

**Need help?** Review the generated `.migration/migration-report.md` for file-specific guidance.

---

## Next Steps

1. **Read this guide fully** before starting
2. **Run analysis script** to understand scope
3. **Start migration** with dry run first
4. **Test thoroughly** before cleanup
5. **Commit changes** once validated

Good luck with your migration! 🚀
