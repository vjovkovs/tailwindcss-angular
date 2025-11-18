/**
 * Bookmarks Table Component (TanStack Query)
 */

import { Component, signal, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { injectQuery } from '@tanstack/angular-query-experimental';

import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { PreviewDialogComponent, PreviewField } from '../../shared/components/preview-dialog/preview-dialog.component';
import { TableConfig, TableColumn, TableAction } from '../../shared/components/data-table/data-table.types';
import type { BookmarksResponse } from '@/core/api/generated';
import { Options } from '@/core/api/generated/@tanstack/angular-query-experimental.gen';

@Component({
  selector: 'app-bookmarks-table',
  standalone: true,
  imports: [CommonModule, DataTableComponent, PreviewDialogComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Bookmarks</h1>
        <p class="mt-2 text-gray-600">Manage and view bookmarks information</p>
      </div>

      <app-data-table
        [data]="bookmarks()"
        [config]="tableConfig()"
        [loading]="loading()"
        (rowClick)="onRowClick($event)"
      />

      <app-preview-dialog
        [isOpen]="previewDialogOpen()"
        [title]="'Bookmarks Details'"
        [fields]="previewFields()"
        (close)="closePreview()"
      />

      <div *ngIf="error()" class="mt-4 rounded-md bg-red-50 p-4">
        <p class="text-red-600">{{ error() }}</p>
      </div>
    </div>
  `,
})
export class BookmarksTableComponent {
  private readonly router = inject(Router);

  private bookmarksQuery = injectQuery(() =>
    Options({ query: { pageNumber: 1, pageSize: 100 } })
  );

  bookmarks = computed(() => this.bookmarksQuery.data()?.items || []);
  loading = computed(() => this.bookmarksQuery.isLoading());
  error = computed(() => this.bookmarksQuery.error()?.message || null);

  previewDialogOpen = signal(false);
  selectedBookmarks = signal<BookmarksResponse | null>(null);

  tableConfig = signal<TableConfig<BookmarksResponse>>({
    columns: [
      { label: 'Id', field: 'id', sortable: true },
      { label: 'Name', field: 'name', sortable: true },
      { label: 'Is Active', field: 'isActive', sortable: true },
      { label: 'Description', field: 'description', sortable: true },
      { label: 'Items', field: 'items', sortable: true },
    ],
    actions: [
      {
        label: 'Edit',
        icon: `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>`,
        handler: (row) => this.onEdit(row),
        buttonClass: 'inline-flex items-center p-1 text-gray-600 hover:text-green-600 focus:outline-none',
      },
    ],
    searchable: true,
    searchPlaceholder: 'Search bookmarks...',
    pageable: true,
    onNew: () => this.router.navigate(['/bookmarks/new']),
    newButtonLabel: 'Add Bookmarks',
  });

  previewFields = signal<PreviewField[]>([]);

  onEdit(item: BookmarksResponse): void {
    this.router.navigate(['/bookmarks', item.id, 'edit']);
  }

  onRowClick(item: BookmarksResponse): void {
    this.selectedBookmarks.set(item);
    this.previewFields.set([
      { label: 'Id', value: item.id },
      { label: 'Name', value: item.name },
      { label: 'Description', value: item.description },
      { label: 'Is Active', value: item.isActive },
      { label: 'Items', value: item.items },
    ]);
    this.previewDialogOpen.set(true);
  }

  closePreview(): void {
    this.previewDialogOpen.set(false);
    this.selectedBookmarks.set(null);
  }
}
