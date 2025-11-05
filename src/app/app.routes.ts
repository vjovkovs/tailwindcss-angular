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
