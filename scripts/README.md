# Migration Scripts

Automated scripts to migrate from manual API code to generated OpenAPI code.

## Scripts Overview

### 1. `migrate-analyze.js`

**Purpose:** Analyzes your codebase and creates a detailed migration plan.

**Usage:**
```bash
node scripts/migrate-analyze.js
# or
npm run migrate:analyze
```

**Output:**
- `.migration/migration-plan.json` - Machine-readable migration plan
- `.migration/migration-report.md` - Human-readable report with file-by-file breakdown

**What it does:**
- Scans all TypeScript files for manual API imports
- Identifies files using manual models, schemas, and services
- Detects custom transformation logic
- Creates mappings from manual code to generated equivalents
- Estimates complexity for each file

---

### 2. `migrate-execute.js`

**Purpose:** Automatically migrates code from manual to generated API.

**Usage:**
```bash
# Dry run (preview changes)
node scripts/migrate-execute.js --dry-run
npm run migrate:execute:dry

# Execute migration
node scripts/migrate-execute.js
npm run migrate:execute

# Migrate specific file
node scripts/migrate-execute.js --file src/app/features/audits/audits-table.component.ts
```

**What it does:**
- Replaces imports: `@core/api/models` → `@core/api/generated`
- Replaces imports: `@core/api/schemas` → `@core/api/generated` (Zod)
- Removes service injections
- Converts service method calls to TanStack Query options
- Adds required imports (`injectQuery`, `injectMutation`)
- Creates backups in `.migration/backup/`

**Transformations:**

**Before:**
```typescript
import { AuditResponse } from '@core/api/models';
import { AuditsService } from '@core/api/services/audits.service';

export class Component {
  private auditsService = inject(AuditsService);
  private query = this.auditsService.getAllAuditsQuery({ pageSize: 100 });
}
```

**After:**
```typescript
import type { AuditResponse } from '@/core/api/generated';
import { auditsGetAllAuditsOptions } from '@/core/api/generated';
import { injectQuery } from '@tanstack/angular-query-experimental';

export class Component {
  private query = injectQuery(() =>
    auditsGetAllAuditsOptions({ query: { pageSize: 100 } })
  );
}
```

---

### 3. `migrate-validate.js`

**Purpose:** Validates that migration was successful.

**Usage:**
```bash
node scripts/migrate-validate.js
# or
npm run migrate:validate
```

**Checks:**
1. **No remaining manual imports** - Ensures no files still import from manual models/services
2. **Valid generated imports** - Verifies all imported items exist in generated code
3. **TypeScript compilation** - Runs `tsc --noEmit` to check for type errors
4. **Unused manual code** - Identifies manual files that can be safely deleted

**Output:**
- `.migration/validation-report.md` - Detailed validation report
- Console output with pass/fail for each check
- Exit code 0 (success) or 1 (failure)

---

### 4. `cleanup-manual-code.js`

**Purpose:** Removes manual API code that's no longer needed.

**Usage:**
```bash
# Dry run (preview deletions)
node scripts/cleanup-manual-code.js --dry-run
npm run migrate:cleanup:dry

# Execute cleanup
node scripts/cleanup-manual-code.js
npm run migrate:cleanup
```

**What it does:**
- Checks which manual files are still imported
- Creates backups in `.migration/deleted-backup/`
- Deletes unused files:
  - `src/app/core/api/models/index.ts`
  - `src/app/core/api/schemas/index.ts`
  - Manual service files (if not imported)
- Removes empty directories

**Keeps:**
- `base-api.service.ts` (utility methods)
- Any files still being imported
- Generated code
- Custom transformers

---

## Migration Workflow

### Step-by-step Process

```bash
# 1. Analyze codebase
npm run migrate:analyze
# Review: .migration/migration-report.md

# 2. Preview migration (dry run)
npm run migrate:execute:dry
# Review console output

# 3. Execute migration
npm run migrate:execute
# Backups created in .migration/backup/

# 4. Validate migration
npm run migrate:validate
# Review: .migration/validation-report.md

# 5. Test application
npm test
npm run dev

# 6. Cleanup manual code
npm run migrate:cleanup:dry  # Preview
npm run migrate:cleanup      # Execute
```

---

## Configuration

Scripts are configured via constants at the top of each file:

### `migrate-analyze.js`
```javascript
const CONFIG = {
  srcDir: 'src/app',
  generatedDir: 'src/app/core/api/generated',
  manualModelsFile: 'src/app/core/api/models/index.ts',
  manualSchemasFile: 'src/app/core/api/schemas/index.ts',
  manualServicesDir: 'src/app/core/api/services',
  outputDir: '.migration',
};
```

### `migrate-execute.js`
```javascript
const CONFIG = {
  srcDir: 'src/app',
  planFile: '.migration/migration-plan.json',
  backupDir: '.migration/backup',
  generatedImportPath: '@/core/api/generated',
};
```

---

## Service Method Mappings

The scripts map manual service methods to generated equivalents:

| Manual Method | Generated Function |
|---------------|-------------------|
| `auditsService.getAllAuditsQuery(params)` | `auditsGetAllAuditsOptions({ query: params })` |
| `auditsService.getAuditByIdQuery(id)` | `auditsGetAuditByIdOptions({ path: { id } })` |
| `auditsService.createAuditMutation()` | `auditsCreateAudit({ body: data })` |
| `suppliersService.getSuppliersQuery(params)` | `referenceSuppliersGetAllSuppliersOptions({ query: params })` |
| `suppliersService.getSupplierQuery(num)` | `referenceSuppliersGetSupplierByNumberOptions({ path: { supplierNumber: num } })` |

Add more mappings in `migrate-execute.js` → `SERVICE_MAPPINGS` object.

---

## Output Files

### `.migration/` Directory Structure

```
.migration/
├── migration-plan.json         # Detailed migration plan (analyze)
├── migration-report.md         # Human-readable report (analyze)
├── validation-report.md        # Validation results (validate)
├── backup/                     # Backups of migrated files (execute)
│   └── src/app/...
└── deleted-backup/             # Backups of deleted files (cleanup)
    └── src/app/...
```

---

## Rollback

### Option 1: Git

```bash
# Reset to before migration
git reset --hard HEAD~1

# Or switch branches
git checkout main
```

### Option 2: Restore from Backups

```bash
# Restore all files
cp -r .migration/backup/src/app/* src/app/

# Restore specific file
cp .migration/backup/src/app/features/audits/audits-table.component.ts \
   src/app/features/audits/audits-table.component.ts
```

---

## Troubleshooting

### Script fails with "Cannot find module"

**Solution:** Ensure you're using Node.js with ES modules support (Node 18+).

### "Migration plan not found"

**Solution:** Run `migrate-analyze.js` first to create the plan.

### "TypeScript compilation failed" after migration

**Solution:**
1. Check the error message in validation report
2. Common issues:
   - Missing imports
   - Type mismatches
   - Path alias issues (`@/` not configured)

**Fix path aliases:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/app/*"]
    }
  }
}
```

### Some files not migrated

**Solution:**
- Check `.migration/migration-report.md` for warnings
- Look for "complex" migrations that need manual handling
- Custom logic may require transformers

---

## Extending the Scripts

### Add New Service Mappings

Edit `migrate-execute.js`:

```javascript
const SERVICE_MAPPINGS = {
  // Add your mapping
  'myService.myMethod': {
    import: 'myGeneratedFunction',
    usage: (params) => `injectQuery(() => myGeneratedFunction({ query: ${params} }))`,
  },
};
```

### Add Custom Validation Checks

Edit `migrate-validate.js`:

```javascript
function myCustomCheck() {
  // Your validation logic
  return { success: true, issues: [] };
}

// Add to main()
results.myCheck = myCustomCheck();
```

---

## Best Practices

1. **Always run dry run first**
   ```bash
   npm run migrate:execute:dry
   ```

2. **Review migration report before executing**
   ```bash
   cat .migration/migration-report.md
   ```

3. **Validate after migration**
   ```bash
   npm run migrate:validate
   ```

4. **Test thoroughly before cleanup**
   ```bash
   npm test && npm run dev
   ```

5. **Keep backups until confident**
   - Backups are in `.migration/backup/`
   - Don't delete until migration is proven stable

6. **Commit incrementally**
   ```bash
   git add .
   git commit -m "feat: migrate to generated API"
   ```

---

## FAQ

**Q: Can I run the migration multiple times?**

A: Yes, but it will overwrite previous changes. Use git branches for safety.

**Q: What if I have custom validation logic?**

A: Create custom transformers in `src/app/core/api/transformers/`. See `supplier-transformer.ts` for example.

**Q: Will this break my tests?**

A: The migration maintains the same TanStack Query patterns, so most tests should continue working. Update import paths if needed.

**Q: Can I migrate one file at a time?**

A: Yes! Use: `npm run migrate:execute --file path/to/file.ts`

**Q: What if generated code is missing an endpoint?**

A: Check your OpenAPI spec. If the endpoint is missing, contact backend team or add it manually.

---

## Support

- **Full Migration Guide:** `docs/MIGRATION_GUIDE.md`
- **Quick Start:** `docs/MIGRATION_QUICK_START.md`
- **API Codegen Docs:** `docs/API_CODEGEN.md`

---

## License

Same as project license.
