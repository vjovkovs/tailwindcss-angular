# API Migration Report

Generated: 2025-11-17T20:17:10.379Z

## Summary

- **Total files to migrate**: 5
- **Components to update**: 0
- **Types to replace**: 7
- **Complex migrations**: 1

## Files Requiring Migration

### src\app\features\audits\audit-edit.component.ts

**Complexity**: simple

**Actions**:
- Replace service: `audits.service`
  - Update methods: AuditsService
- Replace service: `reference-audits.service`
  - Update methods: ReferenceAuditsService
- Replace service: `suppliers.service`
  - Update methods: SuppliersService

### src\app\features\audits\audits-table.component.ts

**Complexity**: simple

**Actions**:
- Replace import from `@core/api/models` to `@core/api/generated`
  - Imports: AuditResponse
- Replace service: `audits.service`
  - Update methods: AuditsService

### src\app\features\example\example-api.component.ts

**Complexity**: simple

**Actions**:
- Replace import from `@core/api/models` to `@core/api/generated`
  - Imports: AuditResponse, SupplierDetailsResponse, FileMetadataResponse, PaginatedResponse

### src\app\features\suppliers\supplier-edit.component.ts

**Complexity**: simple

**Actions**:
- Replace import from `@core/api/models` to `@core/api/generated`
  - Imports: SupplierDetailsResponse
- Replace service: `suppliers.service`
  - Update methods: SuppliersService
- Replace service: `suppliers-query.service`
  - Update methods: SuppliersQueryService

### src\app\features\suppliers\suppliers-table.component.ts

**Complexity**: complex

**Actions**:
- Replace import from `@core/api/models` to `@core/api/generated`
  - Imports: SupplierDetailsResponse
- Replace service: `suppliers.service`
  - Update methods: SuppliersService
- Replace service: `suppliers-query.service`
  - Update methods: SuppliersQueryService

## Warnings

- **src\app\features\suppliers\suppliers-table.component.ts**: Contains custom transformation logic that needs manual review

## Custom Logic Files

These files contain custom transformation logic and require manual review:

- src\app\features\suppliers\suppliers-table.component.ts

## Next Steps

1. Review this report carefully
2. Back up your codebase or create a git branch
3. Run the migration script: `node scripts/migrate-execute.js`
4. Test the migrated code thoroughly
5. Manually handle custom logic in complex files
