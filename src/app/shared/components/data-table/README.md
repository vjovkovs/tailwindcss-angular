# Data Table Component

A comprehensive, reusable table component for Angular with sorting, filtering, pagination, search, and customizable actions.

## Features

- ✅ **Sorting** - Click column headers to sort ascending/descending/none
- ✅ **Filtering** - Client-side filtering with multiple operators (equals, contains, startsWith, etc.)
- ✅ **Pagination** - Configurable page sizes with navigation controls
- ✅ **Search** - Search across all visible columns
- ✅ **Row Selection** - Single or multi-row selection
- ✅ **Row Actions** - Customizable actions (edit, delete, preview, etc.)
- ✅ **Custom Formatting** - Format cell values with functions or templates
- ✅ **Empty & Loading States** - Configurable messages
- ✅ **Responsive Design** - Mobile-friendly with Tailwind CSS
- ✅ **Type-Safe** - Full TypeScript support with generics
- ✅ **Standalone** - No additional dependencies required

## Installation

The component is already part of your Angular application. Simply import it:

```typescript
import { DataTableComponent } from './shared/components/data-table';
import { TableConfig, TableColumn, TableAction } from './shared/components/data-table/data-table.types';
```

## Basic Usage

### 1. Define Your Data Model

```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}
```

### 2. Configure Table Columns

```typescript
const columns: TableColumn<Product>[] = [
  {
    label: 'ID',
    field: 'id',
    sortable: true,
    width: '80px',
  },
  {
    label: 'Product Name',
    field: 'name',
    sortable: true,
  },
  {
    label: 'Price',
    field: 'price',
    sortable: true,
    format: (value) => `$${value.toFixed(2)}`,
  },
  {
    label: 'Category',
    field: 'category',
    sortable: true,
  },
  {
    label: 'Status',
    field: 'inStock',
    sortable: true,
    format: (value) => value ? 'In Stock' : 'Out of Stock',
  },
];
```

### 3. Configure Table Actions

```typescript
const actions: TableAction<Product>[] = [
  {
    label: 'Edit',
    icon: `<svg>...</svg>`, // Your icon SVG
    handler: (product) => this.editProduct(product),
    buttonClass: 'text-blue-600 hover:text-blue-900',
  },
  {
    label: 'Delete',
    icon: `<svg>...</svg>`,
    handler: (product) => this.deleteProduct(product),
    visible: (product) => product.id !== 1, // Hide for product with id 1
    disabled: (product) => product.inStock, // Disable for in-stock products
    buttonClass: 'text-red-600 hover:text-red-900',
  },
];
```

### 4. Configure the Table

```typescript
const tableConfig: TableConfig<Product> = {
  columns: columns,
  actions: actions,
  searchable: true,
  searchPlaceholder: 'Search products...',
  pageable: true,
  pageSizeOptions: [10, 25, 50, 100],
  defaultPageSize: 25,
  selectable: true,
  multiSelect: true,
  showRowNumbers: true,
  emptyStateMessage: 'No products found',
  loadingMessage: 'Loading products...',
  onNew: () => this.router.navigate(['/products/new']),
  newButtonLabel: 'Add Product',
  onRowClick: (product) => this.viewProduct(product),
};
```

### 5. Use in Template

```typescript
@Component({
  selector: 'app-products',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <app-data-table
      [data]="products()"
      [config]="tableConfig"
      [loading]="loading()"
      (rowClick)="onRowClick($event)"
      (selectionChange)="onSelectionChange($event)"
    />
  `,
})
export class ProductsComponent {
  products = signal<Product[]>([]);
  loading = signal(false);
  tableConfig: TableConfig<Product> = { /* ... */ };
}
```

## Configuration Options

### TableConfig<T>

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `columns` | `TableColumn<T>[]` | **required** | Column definitions |
| `actions` | `TableAction<T>[]` | `[]` | Row action buttons |
| `searchable` | `boolean` | `false` | Enable search |
| `searchPlaceholder` | `string` | `'Search...'` | Search input placeholder |
| `pageable` | `boolean` | `false` | Enable pagination |
| `pageSizeOptions` | `number[]` | `[10, 25, 50, 100]` | Page size options |
| `defaultPageSize` | `number` | `10` | Default page size |
| `selectable` | `boolean` | `false` | Enable row selection |
| `multiSelect` | `boolean` | `false` | Allow multiple row selection |
| `showRowNumbers` | `boolean` | `false` | Show row numbers |
| `emptyStateMessage` | `string` | `'No data available'` | Empty state message |
| `loadingMessage` | `string` | `'Loading...'` | Loading state message |
| `tableClass` | `string` | `''` | CSS class for table |
| `onRowClick` | `(row: T) => void` | `undefined` | Row click handler |
| `onNew` | `() => void` | `undefined` | New button handler |
| `newButtonLabel` | `string` | `'New'` | New button label |

### TableColumn<T>

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | **required** | Column header text |
| `field` | `keyof T` | **required** | Data field name |
| `sortable` | `boolean` | `false` | Enable column sorting |
| `filterable` | `boolean` | `false` | Enable column filtering |
| `cellTemplate` | `TemplateRef` | `undefined` | Custom cell template |
| `format` | `(value: any, row: T) => string` | `undefined` | Format function |
| `columnClass` | `string` | `''` | CSS class for cells |
| `headerClass` | `string` | `''` | CSS class for header |
| `width` | `string` | `auto` | Column width |
| `visible` | `boolean` | `true` | Show/hide column |

### TableAction<T>

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | **required** | Action label/tooltip |
| `icon` | `string` | `undefined` | Icon HTML/SVG |
| `handler` | `(row: T) => void` | **required** | Action handler |
| `visible` | `(row: T) => boolean` | `() => true` | Visibility condition |
| `disabled` | `(row: T) => boolean` | `() => false` | Disabled condition |
| `buttonClass` | `string` | `''` | CSS class for button |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `rowClick` | `T` | Emitted when row is clicked |
| `selectionChange` | `T[]` | Emitted when selection changes |
| `sortChange` | `TableSort<T>` | Emitted when sort changes |
| `filterChange` | `TableFilter<T>[]` | Emitted when filters change |
| `pageChange` | `{ pageNumber: number; pageSize: number }` | Emitted when page changes |

## Advanced Examples

### Custom Cell Template

```typescript
@Component({
  template: `
    <app-data-table [data]="data()" [config]="config" />

    <ng-template #statusTemplate let-row let-column="column">
      <span [class]="row.active ? 'badge-success' : 'badge-danger'">
        {{ row.active ? 'Active' : 'Inactive' }}
      </span>
    </ng-template>
  `,
})
export class MyComponent {
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;

  config: TableConfig<MyData> = {
    columns: [
      {
        label: 'Status',
        field: 'active',
        cellTemplate: this.statusTemplate, // Use after view init
      },
    ],
  };
}
```

### Conditional Actions

```typescript
const actions: TableAction<User>[] = [
  {
    label: 'Promote',
    handler: (user) => this.promoteUser(user),
    visible: (user) => user.role !== 'admin',
    disabled: (user) => user.pending,
  },
  {
    label: 'Demote',
    handler: (user) => this.demoteUser(user),
    visible: (user) => user.role === 'admin',
    disabled: (user) => user.id === currentUserId,
  },
];
```

### Server-Side Data

```typescript
@Component({
  template: `
    <app-data-table
      [data]="data()"
      [config]="config"
      [loading]="loading()"
      (pageChange)="onPageChange($event)"
      (sortChange)="onSortChange($event)"
    />
  `,
})
export class ServerSideComponent {
  data = signal<User[]>([]);
  loading = signal(false);

  onPageChange(event: { pageNumber: number; pageSize: number }) {
    this.loading.set(true);
    this.api.getUsers(event.pageNumber, event.pageSize).subscribe({
      next: (response) => {
        this.data.set(response.items);
        this.loading.set(false);
      },
    });
  }

  onSortChange(sort: TableSort<User>) {
    this.loading.set(true);
    this.api.getUsers(1, 25, sort.field, sort.direction).subscribe({
      next: (response) => {
        this.data.set(response.items);
        this.loading.set(false);
      },
    });
  }
}
```

## Styling

The component uses Tailwind CSS utility classes. You can customize styling by:

1. **Column Classes** - Set `columnClass` and `headerClass` on columns
2. **Table Class** - Set `tableClass` on config
3. **Action Classes** - Set `buttonClass` on actions
4. **Global Styles** - Modify `data-table.component.css`

## Example with Preview Dialog

See `src/app/features/suppliers/suppliers-table.component.ts` for a complete example showing:
- Integration with API services
- Edit action (redirects)
- Preview action (opens dialog)
- New button (redirects)
- Error handling
- Loading states

## Accessibility

The component follows accessibility best practices:
- Semantic HTML (`<table>`, `<th>`, `<td>`)
- ARIA labels for buttons and controls
- Keyboard navigation support
- Focus management
- Screen reader friendly

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
