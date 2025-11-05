import { Routes } from '@angular/router';
import { MsalRedirectComponent } from '@azure/msal-angular';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/example/example.component').then((m) => m.ExampleComponent),
  },
  {
    path: 'phase2',
    loadComponent: () =>
      import('./features/example/example-phase2.component').then((m) => m.ExamplePhase2Component),
  },
  {
    path: 'phase3',
    loadComponent: () =>
      import('./features/example/example-phase3.component').then((m) => m.ExamplePhase3Component),
  },
   {
    // Needed for handling redirect after login
    path: 'auth',
    component: MsalRedirectComponent,
  },
];
