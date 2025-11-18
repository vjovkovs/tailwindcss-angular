/**
 * Suppliers Table Component (TanStack Query)
 *
 * Example usage of DataTableComponent with Suppliers data
 * Demonstrates:
 * - TanStack Query for automatic caching and refetching
 * - Sorting, filtering, pagination, search
 * - New button (redirects to create page)
 * - Edit action (redirects to edit page)
 * - Preview action (opens dialog)
 */

import { Component, signal, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { injectQuery } from '@tanstack/angular-query-experimental';

import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { PreviewDialogComponent, PreviewField } from '../../shared/components/preview-dialog/preview-dialog.component';
import { TableConfig, TableColumn, TableAction } from '../../shared/components/data-table/data-table.types';
import type { SupplierDetailsResponse } from '@/core/api/generated';
import { referenceSuppliersGetAllSuppliersOptions } from '@/core/api/generated/@tanstack/angular-query-experimental.gen';

@Component({
  selector: 'app-suppliers-table',
  standalone: true,
  imports: [CommonModule, DataTableComponent, PreviewDialogComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Suppliers</h1>
        <p class="mt-2 text-gray-600">Manage and view supplier information</p>
      </div>

      <!-- Data Table -->
      <app-data-table
        [data]="suppliers()"
        [config]="tableConfig()"
        [loading]="loading()"
        (rowClick)="onRowClick($event)"
      />

      <!-- Preview Dialog -->
      <app-preview-dialog
        [isOpen]="previewDialogOpen()"
        [title]="'Supplier Details'"
        [fields]="previewFields()"
        (close)="closePreview()"
      />

      <!-- Error message -->
      <div
        *ngIf="error()"
        class="mt-4 rounded-md bg-red-50 p-4"
      >
        <div class="flex">
          <div class="shrink-0">
            <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error loading suppliers</h3>
            <div class="mt-2 text-sm text-red-700">
              {{ error() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SuppliersTableComponent {
  private readonly router = inject(Router);

  // TanStack Query for suppliers data
  private suppliersQuery = injectQuery(() => referenceSuppliersGetAllSuppliersOptions());

  // Computed state from query
  suppliers = computed(() => this.suppliersQuery.data()?.items || []);
  loading = computed(() => this.suppliersQuery.isLoading());
  error = computed(() => this.suppliersQuery.error()?.message || null);

  // Dialog state
  previewDialogOpen = signal(false);
  selectedSupplier = signal<SupplierDetailsResponse | null>(null);

  // Table configuration
  tableConfig = signal<TableConfig<SupplierDetailsResponse>>({
    columns: this.getColumns(),
    actions: this.getActions(),
    searchable: true,
    searchPlaceholder: 'Search suppliers by name, number, or location...',
    pageable: true,
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 25,
    selectable: false,
    showRowNumbers: true,
    emptyStateMessage: 'No suppliers found',
    loadingMessage: 'Loading suppliers...',
    tableClass: 'table',
    onNew: () => this.onNew(),
    newButtonLabel: 'Add Supplier',
  });

  // Preview fields
  previewFields = signal<PreviewField[]>([
    { label: 'Supplier Number', value: '', format: (v) => v || '-' },
    { label: 'Supplier Name', value: '', format: (v) => v || '-' },
    { label: 'Location', value: '', format: (v) => v || '-' },
    { label: 'City', value: '', format: (v) => v || '-' },
    { label: 'State', value: '', format: (v) => v || '-' },
    { label: 'Contact', value: '', format: (v) => v || 'No contact' },
    { label: 'Contact Email', value: '', format: (v) => v || 'No email' },
    { label: 'Status', value: '', format: (v) => (v ? 'Active' : 'Inactive') },
    { label: 'NUP Audit', value: '', format: (v) => v || 'N/A' },
    { label: 'Total Audits', value: '', format: (v) => v?.toString() || '0' },
    { label: 'Has Contact', value: '', format: (v) => (v ? 'Yes' : 'No') },
    { label: 'Has Email', value: '', format: (v) => (v ? 'Yes' : 'No') },
  ]);

  /**
   * Get table columns
   */
  private getColumns(): TableColumn<SupplierDetailsResponse>[] {
    return [
      {
        label: 'Supplier Number',
        field: 'supplierNumber',
        sortable: true,
        width: '120px',
      },
      {
        label: 'Name',
        field: 'supplierName',
        sortable: true,
      },
      {
        label: 'Location',
        field: 'location',
        sortable: true,
      },
      {
        label: 'Contact',
        field: 'contact',
        sortable: false,
        format: (value) => value || 'N/A',
      },
      {
        label: 'Email',
        field: 'contactEmail',
        sortable: false,
        format: (value) => value || 'N/A',
      },
      {
        label: 'Status',
        field: 'isActive',
        sortable: true,
        width: '100px',
        format: (value) => (value ? 'Active' : 'Inactive'),
        columnClass: 'px-6 py-4 text-sm',
      },
      {
        label: 'Audits',
        field: 'auditCount',
        sortable: true,
        width: '80px',
        columnClass: 'px-6 py-4 text-sm text-center',
      },
    ];
  }

  /**
   * Get table actions
   */
  private getActions(): TableAction<SupplierDetailsResponse>[] {
    return [
      {
        label: 'Preview',
        icon: `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>`,
        handler: (row) => this.onPreview(row),
        buttonClass: 'inline-flex items-center p-1 text-gray-600 hover:text-blue-600 focus:outline-none',
      },
      {
        label: 'Edit',
        icon: `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>`,
        handler: (row) => this.onEdit(row),
        buttonClass: 'inline-flex items-center p-1 text-gray-600 hover:text-green-600 focus:outline-none',
      },
    ];
  }

  /**
   * Handle new supplier button click - Redirects
   */
  onNew(): void {
    this.router.navigate(['suppliers/new']);
  }

  /**
   * Handle edit action - Redirects
   */
  onEdit(supplier: SupplierDetailsResponse): void {
    this.router.navigate(['/suppliers', supplier.supplierNumber, 'edit']);
  }

  /**
   * Handle preview action - Opens dialog
   */
  onPreview(supplier: SupplierDetailsResponse): void {
    this.selectedSupplier.set(supplier);

    // Update preview fields with current supplier data
    this.previewFields.set([
      { label: 'Supplier Number', value: supplier.supplierNumber },
      { label: 'Supplier Name', value: supplier.supplierName },
      { label: 'Location', value: supplier.location },
      { label: 'City', value: supplier.city },
      { label: 'State', value: supplier.state },
      { label: 'Contact', value: supplier.contact || 'No contact' },
      { label: 'Contact Email', value: supplier.contactEmail || 'No email' },
      {
        label: 'Status',
        value: supplier.isActive,
        format: (v) => (v ? 'Active' : 'Inactive'),
        class: supplier.isActive ? 'mt-1 text-sm font-medium text-green-600' : 'mt-1 text-sm font-medium text-red-600',
      },
      { label: 'NUP Audit', value: supplier.nupAudit || 'N/A' },
      { label: 'Total Audits', value: supplier.auditCount },
      {
        label: 'Has Contact',
        value: supplier.hasContact,
        format: (v) => (v ? 'Yes' : 'No'),
      },
      {
        label: 'Has Email',
        value: supplier.hasEmail,
        format: (v) => (v ? 'Yes' : 'No'),
      },
    ]);

    this.previewDialogOpen.set(true);
  }

  /**
   * Handle row click
   */
  onRowClick(supplier: SupplierDetailsResponse): void {
    // Optional: You could navigate to detail page or open preview
    console.log('Row clicked:', supplier);
    this.onPreview(supplier);
  }

  /**
   * Close preview dialog
   */
  closePreview(): void {
    this.previewDialogOpen.set(false);
    this.selectedSupplier.set(null);
  }
}
