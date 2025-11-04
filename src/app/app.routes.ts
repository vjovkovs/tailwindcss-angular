import { Routes } from '@angular/router';

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
];
