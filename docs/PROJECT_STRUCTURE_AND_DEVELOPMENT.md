# Project Structure and Development Guide

## Table of Contents
- [Project Overview](#project-overview)
- [Project Structure](#project-structure)
- [Architecture Patterns](#architecture-patterns)
- [Generating New Components](#generating-new-components)
- [Implementing New Features](#implementing-new-features)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)

## Project Overview

This is an Angular 18+ application with:
- **TanStack Query** for data fetching and caching
- **Angular Signals** for reactive state management
- **DaisyUI + Tailwind CSS** for styling
- **Zod** for schema validation
- **Standalone Components** (no NgModules)
- **SSO Authentication** with NUPIC API integration
- **Dynamic Forms** system for rapid form development

## Project Structure

```
src/
├── app/
│   ├── core/                       # Core application services and guards
│   │   ├── api/                    # API services
│   │   │   ├── models/             # TypeScript interfaces and types
│   │   │   └── services/           # API service classes
│   │   │       ├── base-api.service.ts      # Base service with HTTP utilities
│   │   │       ├── suppliers.service.ts     # Suppliers API (TanStack Query)
│   │   │       └── audits.service.ts        # Audits API (TanStack Query)
│   │   ├── auth/                   # Authentication services and guards
│   │   │   ├── auth.service.ts     # Auth service (signals-based)
│   │   │   └── auth.guard.ts       # SSO auth guard
│   │   └── interceptors/           # HTTP interceptors
│   │
│   ├── features/                   # Feature modules (lazy-loaded)
│   │   ├── audits/                 # Audits feature
│   │   │   ├── audits-table.component.ts
│   │   │   └── audit-edit.component.ts
│   │   ├── suppliers/              # Suppliers feature
│   │   │   ├── suppliers-table.component.ts
│   │   │   └── supplier-edit.component.ts
│   │   └── example/                # Example components
│   │
│   ├── shared/                     # Shared components and utilities
│   │   ├── components/             # Reusable UI components
│   │   │   ├── dynamic-form/       # Dynamic form system
│   │   │   ├── searchable-select/  # Searchable dropdown component
│   │   │   ├── ui/                 # UI primitives (dialog, table, etc.)
│   │   │   └── navigation/         # Navigation components
│   │   └── utils/                  # Utility functions
│   │
│   ├── app.component.ts            # Root component
│   ├── app.config.ts               # App configuration (providers, etc.)
│   └── app.routes.ts               # Application routes
│
├── assets/                         # Static assets
├── styles/                         # Global styles
└── environments/                   # Environment configurations
```

## Architecture Patterns

### 1. Standalone Components

All components are standalone (no NgModules):

```typescript
@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, /* other components */],
  template: `...`
})
export class MyComponent {}
```

### 2. Angular Signals for State Management

Use signals for reactive state:

```typescript
export class MyComponent {
  // Signal for mutable state
  count = signal(0);

  // Computed signal for derived state
  doubled = computed(() => this.count() * 2);

  // Effect for side effects
  constructor() {
    effect(() => {
      console.log('Count changed:', this.count());
    });
  }

  increment() {
    this.count.update(n => n + 1);
  }
}
```

### 3. TanStack Query for Data Fetching

**Creating a Query Service:**

```typescript
import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { BaseApiService } from './base-api.service';

export class MyDataService {
  private readonly api = inject(BaseApiService);

  /**
   * TanStack Query for fetching items
   * Usage: items = this.myDataService.getItemsQuery(params);
   */
  getItemsQuery(params?: PaginationParams) {
    const queryParams = params || { pageNumber: 1, pageSize: 25 };
    return injectQuery(() => ({
      queryKey: ['items', queryParams],
      queryFn: async () => {
        return this.api.get<PaginatedResponse<Item>>('/api/items', queryParams);
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    }));
  }

  /**
   * TanStack Mutation for creating items
   */
  createItemMutation() {
    return injectMutation((client) => ({
      mutationFn: async (data: CreateItemDto) => {
        return this.api.post<Item>('/api/items', data);
      },
      onSuccess: () => {
        // Invalidate and refetch items query
        client.invalidateQueries({ queryKey: ['items'] });
      },
    }));
  }
}
```

**Using Queries in Components:**

```typescript
export class ItemsListComponent {
  private readonly myDataService = inject(MyDataService);

  // Signal for query parameters
  private params = signal({ pageNumber: 1, pageSize: 25 });

  // Create query
  private itemsQuery = this.myDataService.getItemsQuery(this.params());

  // Computed state from query
  items = computed(() => this.itemsQuery.data()?.items || []);
  loading = computed(() => this.itemsQuery.isLoading());
  error = computed(() => this.itemsQuery.error()?.message || null);
}
```

### 4. DaisyUI + Tailwind CSS Styling

Use DaisyUI components with utility classes:

```html
<!-- Buttons -->
<button class="btn btn-primary">Primary</button>
<button class="btn btn-ghost">Ghost</button>

<!-- Cards -->
<div class="card bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Card Title</h2>
    <p>Card content</p>
  </div>
</div>

<!-- Alerts -->
<div class="alert alert-success">
  <span>Success message</span>
</div>

<!-- Loading -->
<span class="loading loading-spinner loading-md"></span>

<!-- Dropdown -->
<div class="dropdown">
  <button class="btn">Options</button>
  <ul class="dropdown-content menu">
    <li><a>Item 1</a></li>
    <li><a>Item 2</a></li>
  </ul>
</div>
```

### 5. Dynamic Forms with Zod

**Define Schema:**

```typescript
const itemSchema = z.object({
  name: z.string().min(1, 'Name is required').describe('Item Name'),
  description: z.string().optional().describe('Description|textarea'),
  price: z.number().positive('Price must be positive').describe('Price'),
  category: z.string().min(1, 'Category is required').describe('Category'),
  isActive: z.boolean().default(true).describe('Active'),
});

type ItemFormData = z.infer<typeof itemSchema>;
```

**Configure Form:**

```typescript
formConfig: DynamicFormConfig<typeof itemSchema.shape> = {
  schema: itemSchema,
  layout: 'grid',
  columns: 2,
  fields: {
    name: { colSpan: 2 },
    description: { colSpan: 2 },
    price: { colSpan: 1 },
    category: {
      colSpan: 1,
      type: 'searchable-select',
      options: this.categoryOptions(),
      placeholder: 'Select category...'
    },
    isActive: { colSpan: 1 },
  },
  submitLabel: 'Save Item',
  showCancel: true,
};
```

**Use in Template:**

```html
<app-dynamic-form
  [config]="formConfig"
  [initialData]="initialData()"
  (formSubmit)="onSubmit($event)"
  (formCancel)="onCancel()"
/>
```

## Generating New Components

### Using Angular CLI

```bash
# Generate a feature component (in features folder)
ng generate component features/my-feature/my-feature --standalone

# Generate a shared component
ng generate component shared/components/my-component --standalone

# Generate a service
ng generate service core/api/services/my-data

# Generate a guard
ng generate guard core/auth/my-guard

# Generate an interface
ng generate interface core/api/models/my-model
```

### Manual Component Creation

1. **Create component file** in appropriate directory
2. **Mark as standalone** with `standalone: true`
3. **Import dependencies** in the `imports` array
4. **Use signals** for state management
5. **Use DaisyUI** for styling
6. **Export from index.ts** if in a shared location

**Example:**

```typescript
// src/app/shared/components/my-widget/my-widget.component.ts

import { Component, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">{{ title() }}</h2>
        <p>Count: {{ count() }}</p>
        <button class="btn btn-primary" (click)="increment()">
          Increment
        </button>
      </div>
    </div>
  `,
})
export class MyWidgetComponent {
  // Inputs using new signal-based API
  title = input.required<string>();

  // Outputs
  countChanged = output<number>();

  // Local state
  count = signal(0);

  increment() {
    this.count.update(n => n + 1);
    this.countChanged.emit(this.count());
  }
}
```

```typescript
// src/app/shared/components/my-widget/index.ts
export { MyWidgetComponent } from './my-widget.component';
```

## Implementing New Features

### Step-by-Step Feature Implementation

#### 1. Define API Models

```typescript
// src/app/core/api/models/product.model.ts

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  categoryId: number;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  isActive?: boolean;
}
```

#### 2. Create API Service

```typescript
// src/app/core/api/services/products.service.ts

import { inject, Injectable } from '@angular/core';
import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';
import { BaseApiService } from './base-api.service';
import type { Product, CreateProductDto, UpdateProductDto } from '../models/product.model';
import type { PaginatedResponse, PaginationParams } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly api = inject(BaseApiService);

  /**
   * Get all products with pagination
   */
  getProductsQuery(params?: PaginationParams) {
    const queryParams = params || { pageNumber: 1, pageSize: 25 };
    return injectQuery(() => ({
      queryKey: ['products', queryParams],
      queryFn: async () => {
        return this.api.get<PaginatedResponse<Product>>('/api/products', queryParams);
      },
      staleTime: 5 * 60 * 1000,
    }));
  }

  /**
   * Get single product by ID
   */
  getProductQuery(id: number | null) {
    return injectQuery(() => ({
      queryKey: ['product', id],
      queryFn: async () => {
        if (!id) throw new Error('Product ID is required');
        return this.api.get<Product>(`/api/products/${id}`);
      },
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    }));
  }

  /**
   * Create new product
   */
  createProductMutation() {
    return injectMutation((client) => ({
      mutationFn: async (data: CreateProductDto) => {
        return this.api.post<Product>('/api/products', data);
      },
      onSuccess: () => {
        client.invalidateQueries({ queryKey: ['products'] });
      },
    }));
  }

  /**
   * Update existing product
   */
  updateProductMutation() {
    return injectMutation((client) => ({
      mutationFn: async ({ id, data }: { id: number; data: UpdateProductDto }) => {
        return this.api.put<Product>(`/api/products/${id}`, data);
      },
      onSuccess: (_, variables) => {
        client.invalidateQueries({ queryKey: ['products'] });
        client.invalidateQueries({ queryKey: ['product', variables.id] });
      },
    }));
  }

  /**
   * Delete product
   */
  deleteProductMutation() {
    return injectMutation((client) => ({
      mutationFn: async (id: number) => {
        return this.api.delete(`/api/products/${id}`);
      },
      onSuccess: () => {
        client.invalidateQueries({ queryKey: ['products'] });
      },
    }));
  }
}
```

#### 3. Create Table Component

```typescript
// src/app/features/products/products-table.component.ts

import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductsService } from '../../core/api/services/products.service';
import { TableComponent } from '../../shared/components/ui/table';

@Component({
  selector: 'app-products-table',
  standalone: true,
  imports: [CommonModule, TableComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Products</h1>
        <button class="btn btn-primary" (click)="createProduct()">
          Add Product
        </button>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      }

      @if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      }

      @if (!loading() && !error()) {
        <app-table
          [columns]="columns"
          [data]="products()"
          [loading]="loading()"
          (rowClick)="onRowClick($event)"
        />
      }
    </div>
  `,
})
export class ProductsTableComponent {
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);

  // Pagination
  private params = signal({ pageNumber: 1, pageSize: 25 });

  // Query
  private productsQuery = this.productsService.getProductsQuery(this.params());

  // Computed state
  products = computed(() => this.productsQuery.data()?.items || []);
  loading = computed(() => this.productsQuery.isLoading());
  error = computed(() => this.productsQuery.error()?.message || null);

  columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'price', label: 'Price', format: (val: number) => `$${val.toFixed(2)}` },
    { key: 'isActive', label: 'Status', format: (val: boolean) => val ? 'Active' : 'Inactive' },
  ];

  onRowClick(product: any) {
    this.router.navigate(['/products', product.id]);
  }

  createProduct() {
    this.router.navigate(['/products', 'new']);
  }
}
```

#### 4. Create Edit Component with Dynamic Form

```typescript
// src/app/features/products/product-edit.component.ts

import { Component, signal, computed, inject, effect } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { z } from 'zod';
import { DynamicFormComponent, DynamicFormConfig } from '../../shared/components/dynamic-form';
import { ProductsService } from '../../core/api/services/products.service';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required').describe('Product Name'),
  description: z.string().optional().describe('Description|textarea'),
  price: z.number().positive('Price must be positive').describe('Price'),
  categoryId: z.number().int().positive('Category is required').describe('Category ID'),
  isActive: z.boolean().default(true).describe('Active'),
});

type ProductFormData = z.infer<typeof productSchema>;

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent],
  template: `
    <div class="container mx-auto px-4 py-8 max-w-3xl">
      <h1 class="text-3xl font-bold mb-6">
        {{ isEditMode() ? 'Edit Product' : 'New Product' }}
      </h1>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      }

      @if (error()) {
        <div class="alert alert-error mb-6">{{ error() }}</div>
      }

      @if (!loading()) {
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <app-dynamic-form
              [config]="formConfig"
              [initialData]="initialData()"
              (formSubmit)="onSubmit($event)"
              (formCancel)="onCancel()"
            />
          </div>
        </div>
      }
    </div>
  `,
})
export class ProductEditComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);

  private productId = signal<number | null>(null);
  private productQuery = this.productsService.getProductQuery(this.productId());
  private createMutation = this.productsService.createProductMutation();
  private updateMutation = this.productsService.updateProductMutation();

  loading = computed(() => this.productQuery.isLoading());
  error = computed(() => this.productQuery.error()?.message || null);
  isEditMode = computed(() => !!this.productId());

  initialData = computed(() => {
    const product = this.productQuery.data();
    if (!product) return undefined;
    return {
      name: product.name,
      description: product.description,
      price: product.price,
      categoryId: product.categoryId,
      isActive: product.isActive,
    };
  });

  formConfig: DynamicFormConfig<typeof productSchema.shape> = {
    schema: productSchema,
    layout: 'grid',
    columns: 2,
    fields: {
      name: { colSpan: 2 },
      description: { colSpan: 2 },
      price: { colSpan: 1 },
      categoryId: { colSpan: 1 },
      isActive: { colSpan: 1 },
    },
    submitLabel: 'Save Product',
    showCancel: true,
  };

  constructor() {
    effect(() => {
      const id = this.route.snapshot.paramMap.get('id');
      if (id && id !== 'new') {
        this.productId.set(parseInt(id, 10));
      }
    }, { allowSignalWrites: true });
  }

  onSubmit(data: ProductFormData) {
    if (this.isEditMode()) {
      this.updateMutation.mutate(
        { id: this.productId()!, data },
        {
          onSuccess: () => {
            this.router.navigate(['/products']);
          },
        }
      );
    } else {
      this.createMutation.mutate(data, {
        onSuccess: () => {
          this.router.navigate(['/products']);
        },
      });
    }
  }

  onCancel() {
    this.router.navigate(['/products']);
  }
}
```

#### 5. Add Routes

```typescript
// src/app/app.routes.ts

export const routes: Routes = [
  // ... existing routes
  {
    path: 'products',
    loadComponent: () =>
      import('./features/products/products-table.component').then(m => m.ProductsTableComponent),
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./features/products/product-edit.component').then(m => m.ProductEditComponent),
  },
];
```

## Best Practices

### 1. Component Organization

- **Keep components small and focused** - Single responsibility principle
- **Use signals for state** - Reactive and performant
- **Prefer computed over methods** - Automatic dependency tracking
- **Use effects for side effects** - But sparingly

### 2. Service Organization

- **One service per API resource** - e.g., ProductsService, OrdersService
- **Use TanStack Query exclusively** - No Observable/Promise mixing
- **Include proper query keys** - For cache invalidation
- **Set appropriate staleTime** - Balance freshness vs. performance

### 3. Styling Practices

- **Use DaisyUI components** - Consistent design system
- **Add utility classes for spacing** - Tailwind utilities
- **Keep styles in classes** - Avoid inline styles when possible
- **Use theme variables** - `bg-base-100`, `text-base-content`, etc.

### 4. Form Practices

- **Use dynamic forms for CRUD** - Rapid development
- **Define Zod schemas** - Type safety and validation
- **Use searchable-select for large lists** - Better UX
- **Configure field layout** - Grid layout with colSpan

### 5. Error Handling

- **Display user-friendly messages** - Not raw API errors
- **Use alert components** - DaisyUI alerts
- **Handle loading states** - Show spinners
- **Handle empty states** - "No data" messages

## Common Patterns

### Pattern: Paginated Table with Search

```typescript
export class MyTableComponent {
  private service = inject(MyDataService);

  // State
  private searchTerm = signal('');
  private pageNumber = signal(1);
  private pageSize = signal(25);

  // Computed params
  private params = computed(() => ({
    searchTerm: this.searchTerm(),
    pageNumber: this.pageNumber(),
    pageSize: this.pageSize(),
  }));

  // Query with params
  private query = this.service.getItemsQuery(this.params());

  items = computed(() => this.query.data()?.items || []);
  totalCount = computed(() => this.query.data()?.totalCount || 0);
  loading = computed(() => this.query.isLoading());

  onSearch(term: string) {
    this.searchTerm.set(term);
    this.pageNumber.set(1); // Reset to first page
  }

  onPageChange(page: number) {
    this.pageNumber.set(page);
  }
}
```

### Pattern: Form with Dependent Fields

```typescript
const formConfig: DynamicFormConfig<typeof schema.shape> = {
  schema: mySchema,
  fields: {
    country: {
      type: 'select',
      options: countryOptions
    },
    state: {
      type: 'select',
      options: stateOptions,
      condition: {
        field: 'country',
        operator: 'equals',
        value: 'USA'
      }
    },
  },
};
```

### Pattern: Optimistic Updates

```typescript
updateMutation = this.service.updateItemMutation();

onUpdate(id: number, data: UpdateDto) {
  this.updateMutation.mutate(
    { id, data },
    {
      onMutate: async ({ id, data }) => {
        // Cancel outgoing refetches
        await client.cancelQueries({ queryKey: ['items'] });

        // Snapshot previous value
        const previous = client.getQueryData(['items']);

        // Optimistically update
        client.setQueryData(['items'], (old: any) => {
          return {
            ...old,
            items: old.items.map((item: any) =>
              item.id === id ? { ...item, ...data } : item
            )
          };
        });

        return { previous };
      },
      onError: (err, variables, context) => {
        // Rollback on error
        if (context?.previous) {
          client.setQueryData(['items'], context.previous);
        }
      },
      onSettled: () => {
        // Always refetch after error or success
        client.invalidateQueries({ queryKey: ['items'] });
      },
    }
  );
}
```

### Pattern: Master-Detail View

```typescript
// Master component
export class ItemsListComponent {
  selectedId = signal<number | null>(null);

  onSelect(id: number) {
    this.selectedId.set(id);
  }
}

// Detail component (receives selectedId as input)
export class ItemDetailComponent {
  itemId = input.required<number>();

  private service = inject(MyDataService);
  private itemQuery = this.service.getItemQuery(this.itemId());

  item = computed(() => this.itemQuery.data());
  loading = computed(() => this.itemQuery.isLoading());
}
```

## Additional Resources

- [Angular Signals Documentation](https://angular.dev/guide/signals)
- [TanStack Query Angular Documentation](https://tanstack.com/query/latest/docs/framework/angular/overview)
- [DaisyUI Components](https://daisyui.com/components/)
- [Zod Schema Validation](https://zod.dev/)
- Project-specific docs:
  - [API Services and TanStack Query](./API_SERVICES_TANSTACK_QUERY.md)
  - [Dynamic Forms](./DYNAMIC_FORMS.md)
  - [NUPIC API Integration](./NUPIC_API_INTEGRATION.md)
  - [UI Components](./UI_COMPONENTS.md)
