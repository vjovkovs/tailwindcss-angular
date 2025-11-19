import { Routes } from '@angular/router';
import { MsalRedirectComponent } from '@azure/msal-angular';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/example/example.component').then((m) => m.ExampleComponent),
    canActivate: [authGuard],
  },
  {
    path: 'phase2',
    loadComponent: () =>
      import('./features/example/example-phase2.component').then((m) => m.ExamplePhase2Component),
    canActivate: [authGuard],
  },
  {
    path: 'phase3',
    loadComponent: () =>
      import('./features/example/example-phase3.component').then((m) => m.ExamplePhase3Component),
    canActivate: [authGuard],
  },
  {
    path: 'api-example',
    loadComponent: () =>
      import('./features/example/example-api.component').then((m) => m.ExampleApiComponent),
    canActivate: [authGuard],
  }, 
  {
    path: 'personnel',
    loadComponent: () =>
      import('./features/personnel/personnel-table.component').then((m) => m.PersonnelTableComponent),
    canActivate: [authGuard],
  },
  {
    path: 'suppliers',
    loadComponent: () =>
      import('./features/suppliers/suppliers-table.component').then((m) => m.SuppliersTableComponent),
    canActivate: [authGuard],
  },
  {
    path: 'suppliers/new',
    loadComponent: () =>
      import('./features/suppliers/supplier-edit.component').then((m) => m.SupplierEditComponent),
    canActivate: [authGuard],
  },
  {
    path: 'suppliers/:id/edit',
    loadComponent: () =>
      import('./features/suppliers/supplier-edit.component').then((m) => m.SupplierEditComponent),
    canActivate: [authGuard],
  },
  {
    path: 'reference-audits',
    loadComponent: () =>
      import('./features/reference-audits/reference-audits-table.component').then((m) => m.ReferenceAuditsTableComponent),
    canActivate: [authGuard],
  },
  {
    path: 'audits',
    loadComponent: () =>
      import('./features/audits/audits-table.component').then((m) => m.AuditsTableComponent),
    canActivate: [authGuard],
  },
  {
    path: 'audits/new',
    loadComponent: () =>
      import('./features/audits/audit-edit.component').then((m) => m.AuditEditComponent),
    canActivate: [authGuard],
  },
  {
    path: 'audits/:id/edit',
    loadComponent: () =>
      import('./features/audits/audit-edit.component').then((m) => m.AuditEditComponent),
    canActivate: [authGuard],
  },
  {
    // Needed for handling redirect after login
    path: 'auth',
    component: MsalRedirectComponent,
  },
  {
    // Unauthorized access page - no guard
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/authorization/unauthorized.component').then((m) => m.UnauthorizedComponent),
  },
];
