# Feature Generator Documentation

## Overview

The Feature Generator automatically creates CRUD table components from your OpenAPI specification, reducing development time from hours to seconds.

## Quick Start

```bash
# Generate a table component for an entity
npm run generate:table Personnel

# Output:
# ✅ Generated: src/app/features/personnel/personnel-table.component.ts
```

## What Gets Generated

Each generated table component includes:

- ✅ **TanStack Query integration** - Automatic data fetching and caching
- ✅ **DataTable component** - Pre-wired table with sorting, filtering, pagination
- ✅ **Preview dialog** - View entity details
- ✅ **Edit/New navigation** - Routes to edit and create pages
- ✅ **Loading/Error states** - Computed signals for UI states
- ✅ **Column configuration** - Customizable table columns
- ✅ **Row actions** - Edit and preview buttons

## Example Output

```typescript
import { Component, signal, inject, computed } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { referencePersonnelGetPersonnelOptions } from '@/core/api/generated/@tanstack/angular-query-experimental.gen';

@Component({
  selector: 'app-personnel-table',
  // ... full component code
})
export class PersonnelTableComponent {
  private personnelQuery = injectQuery(() =>
    referencePersonnelGetPersonnelOptions({ query: { pageNumber: 1, pageSize: 100 } })
  );

  personnel = computed(() => this.personnelQuery.data()?.items || []);
  loading = computed(() => this.personnelQuery.isLoading());
  // ... rest of component
}
```

## Supported Entities

Currently configured entities:

- **Personnel** - Reference personnel/auditors

### Adding New Entities

Edit `scripts/generators/generate-table.js` and add configuration:

```javascript
const ENTITY_CONFIGS = {
  YourEntity: {
    entityName: 'YourEntity',
    entityPluralName: 'YourEntities',
    apiFunction: 'yourApiFunction', // From generated API
    idField: 'id', // Primary key field
    columns: [
      {
        label: 'ID',
        field: 'id',
        sortable: true,
        width: '80px',
      },
      // ... more columns
    ],
    previewFields: [
      { label: 'ID', field: 'id' },
      // ... more fields
    ],
  },
};
```

## Template Customization

Templates are located in `scripts/generators/templates/`:

- **table-simple.component.ts.hbs** - Main template (recommended)
- **table.component.ts.hbs** - Full-featured template (complex)

### Handlebars Helpers

Available helpers for string transformations:

- `{{pascalCase str}}` - PascalCase (e.g., "MyEntity")
- `{{camelCase str}}` - camelCase (e.g., "myEntity")
- `{{kebabCase str}}` - kebab-case (e.g., "my-entity")
- `{{lowerCase str}}` - lowercase (e.g., "myentity")

### Template Variables

Available in templates:

| Variable | Example | Description |
|----------|---------|-------------|
| `entityName` | Personnel | Entity name (singular) |
| `entityPluralName` | Personnel | Entity name (plural) |
| `apiFunction` | referencePersonnelGetPersonnel | Generated API function |
| `idField` | personnelNumber | Primary key field |
| `columns` | Array | Table column definitions |
| `previewFields` | Array | Preview dialog fields |

## Column Configuration

```javascript
{
  label: 'Personnel #',      // Column header
  field: 'personnelNumber',  // Data field
  sortable: true,            // Enable sorting
  width: '120px',            // Optional width
  format: '(value) => ...',  // Optional formatter
  columnClass: 'text-center' // Optional CSS class
}
```

## Preview Field Configuration

```javascript
{
  label: 'Personnel Number', // Field label
  field: 'personnelNumber',  // Data field
  format: '(v) => ...',      // Optional formatter
  class: '...'               // Optional CSS class
}
```

## Architecture

```
scripts/
└── generators/
    ├── generate-table.js         # Main generator script
    └── templates/
        ├── table-simple.component.ts.hbs  # Template
        └── table.component.ts.hbs         # Alternative template
```

### Generator Flow

1. **Load Configuration** - Get entity config from `ENTITY_CONFIGS`
2. **Load Template** - Read Handlebars template file
3. **Compile** - Apply config to template with Handlebars
4. **Write Output** - Create component file in `src/app/features/{entity}/`

## Next Steps After Generation

1. **Add Route** - Update `src/app/app.routes.ts`:
   ```typescript
   {
     path: 'personnel',
     loadComponent: () => import('./features/personnel/personnel-table.component')
       .then(m => m.PersonnelTableComponent)
   },
   ```

2. **Test** - Run the app:
   ```bash
   ng serve
   ```

3. **Customize** - Adjust columns, preview fields, formatting as needed

## Future Enhancements

Planned features for future versions:

### Phase 2.1: Auto-configuration from OpenAPI
- Parse OpenAPI spec automatically
- Extract entity metadata
- Generate column configs from schema

### Phase 2.2: Edit Component Generator
- Create form components
- Zod schema generation
- CRUD operations (create, update, delete)

### Phase 2.3: Routes Generator
- Generate route configurations
- Navigation setup

### Phase 2.4: Advanced Features
- Relationship handling (foreign keys)
- Custom field type mapping
- Validation rules from OpenAPI
- Search/filter configurations

## Benefits

### Before Generator
- **2 hours** manual work per CRUD feature
- Copy/paste from existing components
- High risk of inconsistencies
- Tedious column configuration

### After Generator
- **30 seconds** to generate base component
- Consistent patterns across features
- Customizable generated code
- **90% reduction** in boilerplate

## Troubleshooting

### Entity not found

```bash
❌ Error: No configuration found for entity "MyEntity"
```

**Solution:** Add entity configuration to `ENTITY_CONFIGS` in `generate-table.js`

### Template parse error

```bash
Error: Parse error on line X
```

**Solution:** Check for unescaped `{{` in template. Use `\{{` for Angular syntax.

### Import errors in generated code

**Solution:** Verify `apiFunction` name matches generated API exports

## Examples

### Generate Personnel Table

```bash
npm run generate:table Personnel
```

Output:
```
🚀 Generating table component for: Personnel
📁 Created directory: src/app/features/personnel
✅ Generated: src/app/features/personnel/personnel-table.component.ts
```

### Dry Run (Preview Only)

```bash
node scripts/generators/generate-table.js Personnel --dry-run
```

Shows preview without creating files.

## Contributing

To improve the generator:

1. **Add new templates** - Create `.hbs` files in `templates/`
2. **Add helpers** - Register new Handlebars helpers in `generate-table.js`
3. **Add entity configs** - Update `ENTITY_CONFIGS`
4. **Test** - Generate and verify TypeScript compilation

## Related Documentation

- [OpenAPI Code Generation](./API_CODEGEN.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [TanStack Query Patterns](https://tanstack.com/query/latest)

---

**Version:** 1.0.0
**Created:** Phase 2 - Feature Generator
**Last Updated:** 2025-11-18
