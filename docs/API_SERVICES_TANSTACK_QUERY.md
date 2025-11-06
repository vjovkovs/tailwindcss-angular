# API Services with TanStack Query Integration

This document explains how to use the API services with both Observable-based and TanStack Query patterns.

## Overview

The application provides two ways to interact with APIs:

1. **Observable-based** (Direct) - Traditional RxJS Observables with `.subscribe()`
2. **TanStack Query** - Modern query/mutation patterns with caching and automatic refetching

Both approaches use the same underlying `BaseApiService` with MSAL authentication.

---

## Authentication

**All API requests automatically include bearer tokens via MSAL interceptor.**

The `MsalInterceptor` (configured in `app.config.ts`) automatically:
- Acquires access tokens for protected resources
- Adds `Authorization: Bearer <token>` headers
- Handles token refresh automatically
- Falls back to interactive login if needed

Protected resources are defined in `environment.ts`:
```typescript
protectedResourceMap: new Map<string, string[]>([
  ['https://localhost:53928/api', ['api://9c097f4f.../access_as_user']],
])
```

**You don't need to manually add authorization headers!**

---

## Approach 1: Observable-based (Direct)

### When to Use
- Simple, one-time data fetching
- When you need fine-grained control over subscriptions
- When you're already using RxJS operators
- Quick prototypes or simple components

### Example: Suppliers Service

```typescript
import { Component, OnInit, signal, inject } from '@angular/core';
import { SuppliersService } from '@core/api/services/suppliers.service';

@Component({
  selector: 'app-suppliers-list',
  template: `
    <div *ngIf="loading()">Loading...</div>
    <div *ngIf="error()">Error: {{ error() }}</div>
    <div *ngFor="let supplier of suppliers()">
      {{ supplier.supplierName }}
    </div>
  `
})
export class SuppliersListComponent implements OnInit {
  private suppliersService = inject(SuppliersService);

  suppliers = signal([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.loading.set(true);

    this.suppliersService.getSuppliers({ pageNumber: 1, pageSize: 100 })
      .subscribe({
        next: (response) => {
          this.suppliers.set(response.items);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message);
          this.loading.set(false);
        }
      });
  }
}
```

### Pros
- ✅ Simple and straightforward
- ✅ Full control over subscription lifecycle
- ✅ Familiar RxJS patterns

### Cons
- ❌ Manual loading/error state management
- ❌ No automatic caching
- ❌ Must manually refetch data
- ❌ More boilerplate code

---

## Approach 2: TanStack Query

### When to Use
- Data that should be cached
- Data that needs automatic refetching
- Optimistic updates
- Complex loading/error states
- List + detail views that share data

### Example: Suppliers Query Service

```typescript
import { Component, inject } from '@angular/core';
import { SuppliersQueryService } from '@core/api/services/suppliers-query.service';

@Component({
  selector: 'app-suppliers-list',
  template: `
    <div *ngIf="suppliers.isLoading()">Loading...</div>
    <div *ngIf="suppliers.error()">Error: {{ suppliers.error().message }}</div>
    <div *ngFor="let supplier of suppliers.data()?.items">
      {{ supplier.supplierName }}
      <button (click)="refetch()">Refresh</button>
    </div>
  `
})
export class SuppliersListComponent {
  private suppliersQueryService = inject(SuppliersQueryService);

  // Automatically fetches, caches, and provides loading/error states
  suppliers = this.suppliersQueryService.suppliers;

  refetch() {
    this.suppliers.refetch();
  }
}
```

### Pros
- ✅ Automatic caching (5 minute default)
- ✅ Automatic refetching on window focus
- ✅ Built-in loading/error/success states
- ✅ Optimistic updates support
- ✅ Query invalidation (automatic data refresh)
- ✅ Less boilerplate code
- ✅ Shared data between components

### Cons
- ❌ Additional learning curve
- ❌ Less control over caching behavior (though configurable)

---

## Implementing TanStack Query in Services

### Step 1: Extend BaseApiService

```typescript
import { Injectable, inject } from '@angular/core';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root',
})
export class MyQueryService extends BaseApiService {
  private queryClient = injectQueryClient();

  // Define queries and mutations...
}
```

### Step 2: Define Queries

```typescript
// Simple query
myDataQuery = injectQuery(() => ({
  queryKey: ['myData'] as const,
  queryFn: () => this.toPromise(
    this.get('/api/mydata', MyDataSchema)
  ),
  staleTime: 1000 * 60 * 5, // 5 minutes
}));

// Parameterized query factory
createMyDataQuery(id: string) {
  return injectQuery(() => ({
    queryKey: ['myData', id] as const,
    queryFn: () => this.toPromise(
      this.get(`/api/mydata/${id}`, MyDataSchema)
    ),
    enabled: !!id, // Only fetch if ID is provided
  }));
}
```

### Step 3: Define Mutations

```typescript
createMyDataMutation() {
  return injectMutation(() => ({
    mutationFn: (data: MyData) => this.toPromise(
      this.post('/api/mydata', data, MyDataSchema)
    ),
    onSuccess: () => {
      // Invalidate list to refetch
      this.queryClient.invalidateQueries({ queryKey: ['myData'] });
    },
  }));
}

updateMyDataMutation() {
  return injectMutation(() => ({
    mutationFn: (data: MyData) => this.toPromise(
      this.put(`/api/mydata/${data.id}`, data, MyDataSchema)
    ),
    onSuccess: (_, variables) => {
      // Invalidate both list and detail
      this.queryClient.invalidateQueries({ queryKey: ['myData'] });
      this.queryClient.invalidateQueries({
        queryKey: ['myData', variables.id]
      });
    },
  }));
}
```

---

## BaseApiService Helper Methods

The `BaseApiService` provides helper methods for TanStack Query:

### toPromise()
Convert Observable to Promise:
```typescript
queryFn: () => this.toPromise(this.getUsers())
```

### createQueryFn()
Create query function:
```typescript
queryFn: this.createQueryFn('/api/users', UsersArraySchema)
```

### createMutationFn()
Create POST mutation function:
```typescript
mutationFn: this.createMutationFn('/api/users', UserSchema, CreateUserSchema)
```

### createUpdateMutationFn()
Create PUT mutation function:
```typescript
mutationFn: this.createUpdateMutationFn(
  (data) => `/api/users/${data.id}`,
  UserSchema,
  UpdateUserSchema
)
```

### createDeleteMutationFn()
Create DELETE mutation function:
```typescript
mutationFn: this.createDeleteMutationFn((id) => `/api/users/${id}`)
```

---

## Query Keys Convention

Follow this convention for query keys:

```typescript
// List queries
['resource', 'list'] as const
['resource', 'list', pageNumber, pageSize] as const

// Detail queries
['resource', 'detail', id] as const

// Search queries
['resource', 'search', searchTerm, pageNumber, pageSize] as const

// Related data
['resource', 'related', parentId, relatedType] as const
```

**Examples:**
```typescript
['suppliers', 'list'] as const
['suppliers', 'detail', '5592'] as const
['suppliers', 'search', 'acme', 1, 25] as const
['audits', 'list', 1, 100] as const
['audits', 'detail', 123] as const
```

---

## Cache Configuration

TanStack Query is configured in `query-client.config.ts`:

```typescript
const queryConfig: DefaultOptions = {
  queries: {
    staleTime: 1000 * 60 * 5,      // 5 minutes
    gcTime: 1000 * 60 * 10,        // 10 minutes (cache time)
    retry: 1,                      // Retry once on failure
    refetchOnWindowFocus: false,   // Don't refetch on window focus
    refetchOnReconnect: true,      // Refetch on reconnect
  },
  mutations: {
    retry: 0,                      // Don't retry mutations
  },
};
```

### Override per query:
```typescript
myQuery = injectQuery(() => ({
  queryKey: ['myData'],
  queryFn: () => this.fetchData(),
  staleTime: 1000 * 60 * 10,  // 10 minutes (override default)
  refetchOnWindowFocus: true,  // Enable for this query
}));
```

---

## Migration Strategy

### Existing Code (Observable)
Keep using Observable-based services for:
- Simple components
- One-time data fetching
- Code that already works well

### New Code (TanStack Query)
Use TanStack Query for:
- New features
- List + detail views
- Data that needs caching
- Forms with optimistic updates

### Hybrid Approach
Use both in the same codebase:
```typescript
// SuppliersService - Observable methods for backward compatibility
// SuppliersQueryService - TanStack Query methods for new features
```

Components can choose which service to use based on their needs.

---

## Examples in Codebase

### Observable Example
- `src/app/features/suppliers/suppliers-table.component.ts`
- `src/app/features/audits/audits-table.component.ts`

### TanStack Query Example
- `src/app/features/example/example.component.ts` (users query)
- `src/app/core/api/services/suppliers-query.service.ts` (suppliers query)

---

## Best Practices

1. **Always use query keys** - Make them descriptive and follow the convention
2. **Invalidate queries** - After mutations, invalidate related queries
3. **Enable/disable queries** - Use `enabled` option for conditional fetching
4. **Handle loading states** - Always show loading indicators
5. **Handle errors** - Always show error messages
6. **Use staleTime wisely** - Longer for static data, shorter for dynamic data
7. **Use Bearer tokens automatically** - MSAL interceptor handles this

---

## Troubleshooting

### "Query is not fetching"
- Check if `enabled` is set to `true`
- Check if query key is stable (use `as const`)
- Check network tab for API calls

### "Data not updating after mutation"
- Ensure you're invalidating queries in `onSuccess`
- Check query keys match between query and invalidation

### "No bearer token in requests"
- Check `protectedResourceMap` in environment
- Ensure API URL matches protected resource pattern
- Check MSAL is initialized (see auth.service.ts)

### "401 Unauthorized"
- User may not be signed in - check `authGuard`
- Token may have expired - MSAL should refresh automatically
- Check token scopes in environment configuration

---

## References

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [MSAL Angular Docs](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Zod Documentation](https://zod.dev)
- BaseApiService: `src/app/core/api/services/base-api.service.ts`
- Query Config: `src/app/core/query/query-client.config.ts`
- API Interceptor: `src/app/core/http/api.interceptor.ts`
