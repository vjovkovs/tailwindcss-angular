import { Routes } from '@angular/router';

export const BookmarksRoutes: Routes = [
  {
    path: 'bookmarks',
    loadComponent: () =>
      import('./bookmarks-table-simple.component').then((m) => m.BookmarksTableComponent),
  },
  {
    path: 'bookmarks/new',
    loadComponent: () =>
      import('./bookmarks-edit.component').then((m) => m.BookmarksEditComponent),
  },
  {
    path: 'bookmarks/:id/edit',
    loadComponent: () =>
      import('./bookmarks-edit.component').then((m) => m.BookmarksEditComponent),
  },
];
