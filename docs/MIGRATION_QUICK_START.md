# Migration Quick Start Guide

**Goal:** Migrate from manual API code to fully using generated OpenAPI code.

**Time:** 1-2 hours

**Outcome:** 80% less API code, 100% type-safe, one-command sync with backend.

---

## Prerequisites ✅

1. **Have OpenAPI spec file:**
   ```bash
   # Download from backend
   curl https://localhost:53928/swagger/v1/swagger.json > openapi-updated.json
   ```

2. **Generate latest code:**
   ```bash
   npm run generate:api
   ```

3. **Create backup:**
   ```bash
   git checkout -b feature/migrate-to-generated-api
   ```

---

## Migration Steps 🚀

### 1. Analyze (2 minutes)

```bash
npm run migrate:analyze
```

Review: `.migration/migration-report.md`

### 2. Preview (1 minute)

```bash
npm run migrate:execute:dry
```

Check what will change (no files modified).

### 3. Execute (1 minute)

```bash
npm run migrate:execute
```

Backups created in `.migration/backup/`

### 4. Handle Custom Logic (10-15 minutes)

**Suppliers transformation:**

```typescript
// Update supplier components to use transformer
import { transformSuppliers } from '@/core/api/transformers/supplier-transformer';

suppliers = computed(() => {
  const data = this.suppliersQuery.data();
  return data?.items ? transformSuppliers(data.items) : [];
});
```

### 5. Validate (2 minutes)

```bash
npm run migrate:validate
```

All checks should pass ✅

### 6. Test (15-20 minutes)

```bash
# Run tests
npm test

# Manual testing
npm run dev
```

Test:
- [ ] Audits table works
- [ ] Suppliers table works
- [ ] Create/edit forms work
- [ ] Search/pagination works
- [ ] Error handling works

### 7. Cleanup (1 minute)

```bash
# Preview deletions
npm run migrate:cleanup:dry

# Execute cleanup
npm run migrate:cleanup
```

### 8. Commit (2 minutes)

```bash
git add .
git commit -m "feat: migrate to generated API code

- Reduced API code by 1,700+ lines (80%)
- Full type safety from API to UI
- One-command sync with backend changes"
```

---

## Command Reference 📚

| Command | Description |
|---------|-------------|
| `npm run migrate:analyze` | Analyze codebase and create migration plan |
| `npm run migrate:execute:dry` | Preview migration changes (no files modified) |
| `npm run migrate:execute` | Execute migration (creates backups) |
| `npm run migrate:validate` | Validate migration success |
| `npm run migrate:cleanup:dry` | Preview manual code cleanup |
| `npm run migrate:cleanup` | Remove unused manual code |

---

## Rollback 🔄

If something goes wrong:

```bash
# Option 1: Git reset
git reset --hard HEAD

# Option 2: Restore from backups
cp -r .migration/backup/src/app/* src/app/
```

---

## Common Issues 🛠️

### TypeScript errors after migration

**Fix:** Check type differences between manual and generated types.

```bash
# See what changed
git diff src/app/core/api/generated/types.gen.ts
```

### Import path errors

**Fix:** Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/app/*"]
    }
  }
}
```

### Validation failing

**Fix:** Use custom transformers for strict validation.

See: `src/app/core/api/transformers/supplier-transformer.ts`

---

## What Changed? 📊

### Before Migration

```typescript
// Manual imports
import { AuditResponse } from '@core/api/models';
import { AuditsService } from '@core/api/services/audits.service';

export class AuditsComponent {
  private auditsService = inject(AuditsService);
  private auditsQuery = this.auditsService.getAllAuditsQuery({ pageSize: 100 });

  audits = computed(() => this.auditsQuery.data()?.items || []);
}
```

### After Migration

```typescript
// Generated imports
import type { AuditResponse } from '@/core/api/generated';
import { auditsGetAllAuditsOptions } from '@/core/api/generated';
import { injectQuery } from '@tanstack/angular-query-experimental';

export class AuditsComponent {
  private auditsQuery = injectQuery(() =>
    auditsGetAllAuditsOptions({ query: { pageSize: 100 } })
  );

  audits = computed(() => this.auditsQuery.data()?.items || []);
}
```

**Changes:**
- ✅ No service injection needed
- ✅ Direct use of generated query options
- ✅ Same TanStack Query pattern
- ✅ Fully type-safe

---

## Post-Migration Workflow 🔄

When backend changes:

```bash
# 1. Get new spec
curl https://localhost:53928/swagger/v1/swagger.json > openapi-updated.json

# 2. Regenerate
npm run generate:api

# 3. Test
npm test

# 4. Commit
git add openapi-updated.json src/app/core/api/generated/
git commit -m "chore: update API client"
```

---

## Need Help? 📖

- **Full Guide:** `docs/MIGRATION_GUIDE.md`
- **API Codegen Docs:** `docs/API_CODEGEN.md`
- **Custom Logic:** See `src/app/core/api/transformers/`
- **Issues:** Check `.migration/validation-report.md`

---

## Success Metrics ✨

After migration, you'll have:

- ✅ **1,700+ fewer lines** of manual code
- ✅ **100% type coverage** from API to UI
- ✅ **One-command sync** with backend changes
- ✅ **Automatic validation** with Zod
- ✅ **Faster development** - no more manual model updates

**Ready?** Start with: `npm run migrate:analyze` 🚀
