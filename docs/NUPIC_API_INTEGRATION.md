# NUPIC Document Manager API Integration

Complete TypeScript/Angular integration for the NUPIC Document Manager API with type safety, Zod validation, and MSAL authentication.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Setup](#setup)
- [API Services](#api-services)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Overview

This integration provides:

- **Type-Safe API Client**: Strongly-typed interfaces for all API endpoints
- **Runtime Validation**: Zod schemas for request/response validation
- **Authentication**: Automatic MSAL token attachment via HTTP interceptor
- **Error Handling**: Standardized error handling with ProblemDetails support
- **Pagination**: Built-in pagination support for list endpoints

### API Endpoints

The NUPIC API provides 7 main endpoint groups:

1. **Audits** - Full CRUD operations for managing audits
2. **NUPIC Audits** - Read-only access to NUPIC audit data
3. **Suppliers** - Supplier information and search
4. **Audit Files** - File upload, download, and management
5. **Document Bookmarks** - Bookmark management for documents
6. **Phase Assignments** - Phase management for audits
7. **Document Merge** - Merge audit documents with templates

## Architecture

```
src/app/core/api/
├── models/
│   └── index.ts              # TypeScript interfaces
├── schemas/
│   └── index.ts              # Zod validation schemas
└── services/
    ├── base-api.service.ts   # Base HTTP client with validation
    ├── audits.service.ts     # Audits CRUD operations
    ├── nupic-audits.service.ts  # NUPIC read-only operations
    ├── suppliers.service.ts  # Supplier operations
    ├── audit-files.service.ts   # File management
    ├── phase-assignments.service.ts  # Phase management
    ├── document-bookmarks.service.ts # Bookmark operations
    └── index.ts              # Service exports
```

### Key Features

- **BaseApiService**: Common HTTP functionality for all services
- **Automatic Validation**: Zod schema validation for all requests/responses
- **Type Inference**: TypeScript types automatically inferred from Zod schemas
- **MSAL Integration**: Automatic token attachment via HTTP interceptor
- **Error Mapping**: HTTP errors mapped to ApiError with ProblemDetails support

## Setup

### 1. Environment Configuration

Update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  appName: 'NUPIC Document Manager',
  companyName: 'Your Company',

  // NUPIC API Configuration
  baseUrl: 'https://localhost:53928',
  apiUrl: 'https://localhost:53928/api',

  // MSAL Configuration
  msal: {
    clientId: '9c097f4f-fe4c-4035-abe9-2b41caaf983c',
    authority: 'https://login.microsoftonline.com/a59f659e-5ea2-4277-9acc-914bdc19f725',
    redirectUri: '/auth',
    postLogoutRedirectUri: '/',
    scopes: [
      'api://9c097f4f-fe4c-4035-abe9-2b41caaf983c/access_as_user',
      'User.Read',
      'profile',
      'email',
      'openid'
    ],
    protectedResourceMap: new Map<string, string[]>([
      ['https://graph.microsoft.com/v1.0/me', ['User.Read']],
      ['https://localhost:53928/api', ['api://9c097f4f-fe4c-4035-abe9-2b41caaf983c/access_as_user']],
    ]),
  },
};
```

### 2. HTTPS Setup

The NUPIC API requires HTTPS. Generate SSL certificates:

```bash
npm run ssl:generate
npm run start:https
```

### 3. Azure AD Configuration

Ensure your Azure AD application has:
- **Redirect URI**: `https://localhost:4200/auth`
- **API Permissions**: `api://9c097f4f-fe4c-4035-abe9-2b41caaf983c/access_as_user`
- **Supported account types**: Configured appropriately
- **Authentication**: Single-page application platform configured

## API Services

### Audits Service

Full CRUD operations for managing audits.

```typescript
import { inject } from '@angular/core';
import { AuditsService } from '@core/api/services';

class MyComponent {
  private auditsService = inject(AuditsService);

  // Get all audits with pagination
  loadAudits() {
    this.auditsService.getAllAudits({
      pageNumber: 1,
      pageSize: 20,
      search: 'nuclear'
    }).subscribe(audits => {
      console.log('Total:', audits.totalCount);
      console.log('Items:', audits.items);
    });
  }

  // Create new audit
  createAudit() {
    this.auditsService.createAudit({
      auditNumber: '12345',
      supplierNumber: '1234',
      leadUtilityCode: 'ABC',
      auditTypeId: 1,
      fkPerNumb: null,
      contactPersonEmail: 'contact@example.com',
      alternateContact: 'alt@example.com',
      startDate: '2025-01-01T00:00:00Z',
      endDate: null,
    }).subscribe(audit => {
      console.log('Created:', audit);
    });
  }

  // Get audit by ID
  getAudit(id: number) {
    this.auditsService.getAuditById(id).subscribe(audit => {
      console.log('Audit:', audit);
    });
  }

  // Update audit
  updateAudit(id: number) {
    this.auditsService.updateAudit(id, {
      leadUtilityCode: 'XYZ',
      fkPerNumb: null,
      contactPersonEmail: 'updated@example.com',
      alternateContact: 'alt@example.com',
      startDate: '2025-01-01T00:00:00Z',
      endDate: null,
      dateNotified: '2025-01-01T00:00:00Z',
      updatedBy: 'user@example.com',
    }).subscribe(audit => {
      console.log('Updated:', audit);
    });
  }

  // Approve audit
  approveAudit(id: number) {
    this.auditsService.approveAudit(id).subscribe(audit => {
      console.log('Approved:', audit);
    });
  }

  // Get audit types
  loadAuditTypes() {
    this.auditsService.getAuditTypes().subscribe(types => {
      console.log('Types:', types);
    });
  }
}
```

### Suppliers Service

Access supplier information and search.

```typescript
import { inject } from '@angular/core';
import { SuppliersService } from '@core/api/services';

class MyComponent {
  private suppliersService = inject(SuppliersService);

  // Get all suppliers with pagination
  loadSuppliers() {
    this.suppliersService.getSuppliers({
      pageNumber: 1,
      pageSize: 50,
    }).subscribe(suppliers => {
      console.log('Suppliers:', suppliers.items);
    });
  }

  // Get specific supplier
  getSupplier(supplierNumber: string) {
    this.suppliersService.getSupplier(supplierNumber).subscribe(supplier => {
      console.log('Supplier:', supplier);
    });
  }

  // Search suppliers
  searchSuppliers(term: string) {
    this.suppliersService.searchSuppliers(term, {
      pageSize: 20
    }).subscribe(results => {
      console.log('Search results:', results.items);
    });
  }
}
```

### Audit Files Service

File upload, download, and management.

```typescript
import { inject } from '@angular/core';
import { AuditFilesService } from '@core/api/services';

class MyComponent {
  private auditFilesService = inject(AuditFilesService);

  // Upload files
  uploadFiles(auditId: number, files: FileList) {
    const filesArray = Array.from(files);
    this.auditFilesService.uploadFiles(
      auditId,
      filesArray,
      1, // phaseAssignmentId
      'Audit documents'
    ).subscribe(metadata => {
      console.log('Uploaded files:', metadata);
    });
  }

  // Get audit files
  getFiles(auditId: number) {
    this.auditFilesService.getAuditFiles(auditId).subscribe(files => {
      console.log('Files:', files);
    });
  }

  // Download file
  downloadFile(auditId: number, fileId: number) {
    this.auditFilesService.downloadFile(auditId, fileId).subscribe(blob => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'document.pdf';
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }

  // Or use the helper method
  downloadFileHelper(auditId: number, fileId: number, fileName: string) {
    this.auditFilesService.downloadFileAndSave(auditId, fileId, fileName).subscribe();
  }

  // Update file metadata
  updateFile(auditId: number, fileId: number) {
    this.auditFilesService.updateFileMetadata(auditId, fileId, {
      fileName: 'Updated Document.pdf',
      sortOrder: 1,
      notifiedDate: '2025-01-01T00:00:00Z',
      notifiedEmail: 'notify@example.com',
      updatedBy: 'user@example.com',
    }).subscribe(file => {
      console.log('Updated:', file);
    });
  }

  // Delete file
  deleteFile(auditId: number, fileId: number) {
    this.auditFilesService.deleteFile(auditId, fileId).subscribe(() => {
      console.log('File deleted');
    });
  }
}
```

### NUPIC Audits Service (Read-Only)

Access NUPIC audit data (read-only).

```typescript
import { inject } from '@angular/core';
import { NupicAuditsService } from '@core/api/services';

class MyComponent {
  private nupicAuditsService = inject(NupicAuditsService);

  // Get all NUPIC audits
  loadNupicAudits() {
    this.nupicAuditsService.getAllNupicAudits().subscribe(audits => {
      console.log('NUPIC Audits:', audits);
    });
  }

  // Get specific NUPIC audit
  getNupicAudit(auditNumber: string) {
    this.nupicAuditsService.getNupicAuditByNumber(auditNumber).subscribe(audit => {
      console.log('Audit:', audit);
    });
  }

  // Check if audit exists
  checkAuditExists(auditNumber: string) {
    this.nupicAuditsService.nupicAuditExists(auditNumber).subscribe(exists => {
      console.log('Exists:', exists);
    });
  }

  // Get audits by supplier
  getSupplierAudits(supplierNumber: string) {
    this.nupicAuditsService.getNupicAuditsBySupplier(supplierNumber).subscribe(audits => {
      console.log('Supplier audits:', audits);
    });
  }
}
```

### Phase Assignments Service

Manage audit phases.

```typescript
import { inject } from '@angular/core';
import { PhaseAssignmentsService } from '@core/api/services';

class MyComponent {
  private phaseService = inject(PhaseAssignmentsService);

  // Get phase assignments
  getPhases(auditId: number) {
    this.phaseService.getPhaseAssignments(auditId).subscribe(phases => {
      console.log('Phases:', phases);
    });
  }

  // Complete phase
  completePhase(auditId: number, phaseId: number) {
    this.phaseService.completePhase(auditId, phaseId, {
      comments: 'Phase completed successfully',
      sendNotification: true,
    }).subscribe(() => {
      console.log('Phase completed');
    });
  }

  // Update phase
  updatePhase(auditId: number, phaseId: number) {
    this.phaseService.updatePhaseAssignment(auditId, phaseId, {
      status: 'In Progress',
      isActive: true,
    }).subscribe(phase => {
      console.log('Updated phase:', phase);
    });
  }
}
```

### Document Bookmarks Service

Manage document bookmarks.

```typescript
import { inject } from '@angular/core';
import { DocumentBookmarksService } from '@core/api/services';

class MyComponent {
  private bookmarksService = inject(DocumentBookmarksService);

  // Get bookmarks
  getBookmarks(documentId: number) {
    this.bookmarksService.getDocumentBookmarks(documentId).subscribe(bookmarks => {
      console.log('Bookmarks:', bookmarks);
    });
  }

  // Create bookmark
  createBookmark() {
    this.bookmarksService.createDocumentBookmark({
      fileMetadataId: 1,
      bookmarkId: 1,
      value: 'Bookmark value',
    }).subscribe(bookmark => {
      console.log('Created:', bookmark);
    });
  }

  // Get bookmark templates
  getTemplates() {
    this.bookmarksService.getBookmarkTemplates().subscribe(templates => {
      console.log('Templates:', templates);
    });
  }

  // Apply template
  applyTemplate(documentId: number, templateId: number) {
    this.bookmarksService.applyBookmarkTemplate(documentId, templateId).subscribe(bookmarks => {
      console.log('Applied bookmarks:', bookmarks);
    });
  }
}
```

## Usage Examples

### Complete Component Example

See `src/app/features/example/example-api.component.ts` for a full working example with:
- Pagination
- Search
- Error handling
- Loading states
- Type-safe API calls

### File Upload with Progress

```typescript
uploadFilesWithProgress(auditId: number, files: FileList) {
  const filesArray = Array.from(files);

  this.auditFilesService.uploadFiles(auditId, filesArray)
    .subscribe({
      next: (metadata) => {
        console.log(`Uploaded ${metadata.length} files successfully`);
        metadata.forEach(file => {
          console.log(`- ${file.fileName} (${file.fileSizeFormatted})`);
        });
      },
      error: (error: ApiError) => {
        console.error('Upload failed:', error.message);
        if (error.details) {
          console.error('Details:', error.details);
        }
      }
    });
}
```

### Pagination Helper

```typescript
async loadAllAudits(): Promise<AuditResponse[]> {
  const allAudits: AuditResponse[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await firstValueFrom(
      this.auditsService.getAllAudits({
        pageNumber: currentPage,
        pageSize: 100
      })
    );

    allAudits.push(...response.items);
    hasMore = response.hasNextPage;
    currentPage++;
  }

  return allAudits;
}
```

## Error Handling

### ApiError Structure

```typescript
interface ApiError {
  message: string;
  status: number;
  details?: ProblemDetails;
  originalError?: any;
}

interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: any;
}
```

### Error Handling Example

```typescript
this.auditsService.getAuditById(123).subscribe({
  next: (audit) => {
    console.log('Audit:', audit);
  },
  error: (error: ApiError) => {
    console.error('Error:', error.message);

    switch (error.status) {
      case 404:
        console.error('Audit not found');
        break;
      case 401:
        console.error('Unauthorized - please log in');
        break;
      case 403:
        console.error('Forbidden - insufficient permissions');
        break;
      case 400:
        if (error.details) {
          console.error('Validation errors:', error.details);
        }
        break;
      default:
        console.error('Unexpected error:', error);
    }
  }
});
```

## Best Practices

### 1. Use Signals for Reactive State

```typescript
class MyComponent {
  audits = signal<PaginatedResponse<AuditResponse> | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  loadAudits() {
    this.loading.set(true);
    this.error.set(null);

    this.auditsService.getAllAudits().subscribe({
      next: (audits) => {
        this.audits.set(audits);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.message);
        this.loading.set(false);
      }
    });
  }
}
```

### 2. Validate Before Sending

```typescript
import { CreateAuditRequestSchema } from '@core/api/schemas';

createAudit(data: unknown) {
  try {
    // Validate data before sending
    const validated = CreateAuditRequestSchema.parse(data);

    this.auditsService.createAudit(validated).subscribe({
      next: (audit) => console.log('Created:', audit),
      error: (error) => console.error('Error:', error)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
    }
  }
}
```

### 3. Unsubscribe Properly

```typescript
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

class MyComponent {
  private destroyRef = inject(DestroyRef);

  loadAudits() {
    this.auditsService.getAllAudits()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(audits => {
        console.log('Audits:', audits);
      });
  }
}
```

### 4. Type Safety

```typescript
// ✅ Good - Type-safe with inference
const audits = await firstValueFrom(
  this.auditsService.getAllAudits()
);
console.log(audits.totalCount); // TypeScript knows this exists

// ❌ Bad - No type safety
const response: any = await fetch('/api/Audits');
const audits = await response.json();
console.log(audits.totalCount); // No type checking
```

### 5. Error Recovery

```typescript
import { retry, catchError, of } from 'rxjs';

this.auditsService.getAllAudits()
  .pipe(
    retry(3), // Retry up to 3 times
    catchError(error => {
      console.error('Failed after retries:', error);
      return of({ items: [], totalCount: 0, pageNumber: 1, pageSize: 20, totalPages: 0, hasPreviousPage: false, hasNextPage: false });
    })
  )
  .subscribe(audits => {
    console.log('Audits:', audits);
  });
```

## Testing

### Unit Testing Services

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuditsService } from './audits.service';

describe('AuditsService', () => {
  let service: AuditsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuditsService]
    });

    service = TestBed.inject(AuditsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get all audits', () => {
    const mockResponse = {
      items: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 20,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false
    };

    service.getAllAudits().subscribe(response => {
      expect(response.items).toEqual([]);
      expect(response.totalCount).toBe(0);
    });

    const req = httpMock.expectOne(`${service['baseUrl']}/api/Audits`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
```

## Troubleshooting

### CORS Issues

If you encounter CORS errors, ensure:
1. API server allows `https://localhost:4200` origin
2. MSAL interceptor is properly configured
3. API URL in environment matches server

### Authentication Failures

1. Check that MSAL scope matches API configuration
2. Verify Azure AD application has correct API permissions
3. Ensure redirect URI is registered in Azure portal
4. Check browser console for MSAL errors

### Validation Errors

If Zod validation fails:
1. Check API response matches schema
2. Update schema if API changed
3. Use `.passthrough()` for schemas with extra fields

```typescript
const schema = AuditResponseSchema.passthrough();
```

## Additional Resources

- [MSAL Angular Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular)
- [Zod Documentation](https://zod.dev/)
- [Angular Signals](https://angular.dev/guide/signals)
- [RxJS Operators](https://rxjs.dev/api)
