import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/example/example.component').then((m) => m.ExampleComponent),
  },
];
