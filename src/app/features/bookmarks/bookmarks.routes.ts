import { Routes } from '@angular/router';

export const BookmarksRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./bookmarks-table-simple.component').then((m) => m.BookmarksTableComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./bookmarks-edit.component').then((m) => m.BookmarksEditComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./bookmarks-edit.component').then((m) => m.BookmarksEditComponent),
  },
];
