/**
 * Personnel Table Component (TanStack Query)
 */

import { Component, signal, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { injectQuery } from '@tanstack/angular-query-experimental';

import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { PreviewDialogComponent, PreviewField } from '../../shared/components/preview-dialog/preview-dialog.component';
import { TableConfig, TableColumn, TableAction } from '../../shared/components/data-table/data-table.types';
import type { PersonnelResponse } from '@/core/api/generated';
import { referencePersonnelGetPersonnelOptions } from '@/core/api/generated/@tanstack/angular-query-experimental.gen';

@Component({
  selector: 'app-personnel-table',
  standalone: true,
  imports: [CommonModule, DataTableComponent, PreviewDialogComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Personnel</h1>
        <p class="mt-2 text-gray-600">Manage and view personnel information</p>
      </div>

      <app-data-table
        [data]="personnel()"
        [config]="tableConfig()"
        [loading]="loading()"
        (rowClick)="onRowClick($event)"
      />

      <app-preview-dialog
        [isOpen]="previewDialogOpen()"
        [title]="'Personnel Details'"
        [fields]="previewFields()"
        (close)="closePreview()"
      />

      <div *ngIf="error()" class="mt-4 rounded-md bg-red-50 p-4">
        <p class="text-red-600">{{ error() }}</p>
      </div>
    </div>
  `,
})
export class PersonnelTableComponent {
  private readonly router = inject(Router);

  private personnelQuery = injectQuery(() =>
    referencePersonnelGetPersonnelOptions({ query: { pageNumber: 1, pageSize: 100 } })
  );

  personnel = computed(() => this.personnelQuery.data()?.items || []);
  loading = computed(() => this.personnelQuery.isLoading());
  error = computed(() => this.personnelQuery.error()?.message || null);

  previewDialogOpen = signal(false);
  selectedPersonnel = signal<PersonnelResponse | null>(null);

  tableConfig = signal<TableConfig<PersonnelResponse>>({
    columns: [
      { label: 'Personnel #', field: 'personnelNumber', sortable: true },
      { label: 'Name', field: 'name', sortable: true },
      { label: 'Email', field: 'email', sortable: true },
      { label: 'Member', field: 'memberName', sortable: true },
      { label: 'Role', field: 'role', sortable: true },
      { label: 'Utility', field: 'utilityCode', sortable: true },
      { label: 'Active', field: 'isActive', sortable: true },
      { label: 'Auditor', field: 'isAuditor', sortable: true },
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
    searchPlaceholder: 'Search personnel...',
    pageable: true,
    onNew: () => this.router.navigate(['/personnel/new']),
    newButtonLabel: 'Add Personnel',
  });

  previewFields = signal<PreviewField[]>([]);

  onEdit(item: PersonnelResponse): void {
    this.router.navigate(['/personnel', item.personnelNumber, 'edit']);
  }

  onRowClick(item: PersonnelResponse): void {
    this.selectedPersonnel.set(item);
    this.previewFields.set([
      { label: 'Personnel Number', value: item.personnelNumber },
      { label: 'Personnel ID', value: item.personnelId },
      { label: 'Name', value: item.name },
      { label: 'Email', value: item.email },
      { label: 'Member Code', value: item.memberCode },
      { label: 'Member Name', value: item.memberName },
      { label: 'Role', value: item.role },
      { label: 'Phone', value: item.phone },
      { label: 'Utility Code', value: item.utilityCode },
      { label: 'Active', value: item.isActive },
      { label: 'Auditor', value: item.isAuditor },
    ]);
    this.previewDialogOpen.set(true);
  }

  closePreview(): void {
    this.previewDialogOpen.set(false);
    this.selectedPersonnel.set(null);
  }
}
