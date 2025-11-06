/**
 * Audits Table Component (TanStack Query)
 *
 * Table view for audits with sorting, filtering, pagination, and search
 * Demonstrates:
 * - TanStack Query for automatic caching and refetching
 * - New button (redirects to create page)
 * - Edit action (redirects to edit page)
 * - Preview action (opens dialog)
 */

import { Component, signal, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { PreviewDialogComponent, PreviewField } from '../../shared/components/preview-dialog/preview-dialog.component';
import { TableConfig, TableColumn, TableAction } from '../../shared/components/data-table/data-table.types';
import { AuditResponse } from '../../core/api/models';
import { AuditsService } from '../../core/api/services/audits.service';

@Component({
  selector: 'app-audits-table',
  standalone: true,
  imports: [CommonModule, DataTableComponent, PreviewDialogComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Audits</h1>
        <p class="mt-2 text-gray-600">Manage and view audit information</p>
      </div>

      <!-- Data Table -->
      <app-data-table
        [data]="audits()"
        [config]="tableConfig()"
        [loading]="loading()"
        (rowClick)="onRowClick($event)"
      />

      <!-- Preview Dialog -->
      <app-preview-dialog
        [isOpen]="previewDialogOpen()"
        [title]="'Audit Details'"
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
            <h3 class="text-sm font-medium text-red-800">Error loading audits</h3>
            <div class="mt-2 text-sm text-red-700">
              {{ error() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AuditsTableComponent {
  private readonly router = inject(Router);
  private readonly auditsService = inject(AuditsService);

  // TanStack Query for audits data
  private auditsQuery = this.auditsService.getAllAuditsQuery({ pageNumber: 1, pageSize: 100 });

  // Computed state from query
  audits = computed(() => this.auditsQuery.data()?.items || []);
  loading = computed(() => this.auditsQuery.isLoading());
  error = computed(() => this.auditsQuery.error()?.message || null);

  // Dialog state
  previewDialogOpen = signal(false);
  selectedAudit = signal<AuditResponse | null>(null);

  // Table configuration
  tableConfig = signal<TableConfig<AuditResponse>>({
    columns: this.getColumns(),
    actions: this.getActions(),
    searchable: true,
    searchPlaceholder: 'Search audits by number, supplier, or type...',
    pageable: true,
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 25,
    selectable: false,
    showRowNumbers: true,
    emptyStateMessage: 'No audits found',
    loadingMessage: 'Loading audits...',
    onNew: () => this.onNew(),
    newButtonLabel: 'Add Audit',
  });

  // Preview fields
  previewFields = signal<PreviewField[]>([]);

  /**
   * Get table columns
   */
  private getColumns(): TableColumn<AuditResponse>[] {
    return [
      {
        label: 'Audit #',
        field: 'auditNumber',
        sortable: true,
        width: '120px',
      },
      {
        label: 'Supplier #',
        field: 'supplierNumber',
        sortable: true,
        width: '120px',
      },
      {
        label: 'Type',
        field: 'auditTypeName',
        sortable: true,
      },
      {
        label: 'Lead Utility',
        field: 'leadUtilityCode',
        sortable: true,
        width: '120px',
      },
      {
        label: 'Lead Auditor',
        field: 'leadAuditorName',
        sortable: true,
      },
      {
        label: 'Start Date',
        field: 'startDate',
        sortable: true,
        format: (value) => value ? new Date(value).toLocaleDateString() : 'N/A',
      },
      {
        label: 'End Date',
        field: 'endDate',
        sortable: true,
        format: (value) => value ? new Date(value).toLocaleDateString() : 'N/A',
      },
      {
        label: 'Approved',
        field: 'auditApproved',
        sortable: true,
        width: '100px',
        format: (value) => (value ? 'Yes' : 'No'),
        columnClass: 'px-6 py-4 text-sm text-center',
      },
    ];
  }

  /**
   * Get table actions
   */
  private getActions(): TableAction<AuditResponse>[] {
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
   * Handle new audit button click - Redirects
   */
  onNew(): void {
    this.router.navigate(['/audits/new']);
  }

  /**
   * Handle edit action - Redirects
   */
  onEdit(audit: AuditResponse): void {
    this.router.navigate(['/audits', audit.id, 'edit']);
  }

  /**
   * Handle preview action - Opens dialog
   */
  onPreview(audit: AuditResponse): void {
    this.selectedAudit.set(audit);

    // Update preview fields with current audit data
    this.previewFields.set([
      { label: 'Audit Number', value: audit.auditNumber },
      { label: 'Supplier Number', value: audit.supplierNumber },
      { label: 'Audit Type', value: audit.auditTypeName },
      { label: 'Lead Utility Code', value: audit.leadUtilityCode },
      { label: 'Lead Auditor', value: audit.leadAuditorName },
      { label: 'Contact Person Email', value: audit.contactPersonEmail },
      { label: 'Alternate Contact', value: audit.alternateContact },
      {
        label: 'Start Date',
        value: audit.startDate,
        format: (v) => (v ? new Date(v).toLocaleDateString() : 'Not set'),
      },
      {
        label: 'End Date',
        value: audit.endDate,
        format: (v) => (v ? new Date(v).toLocaleDateString() : 'Not set'),
      },
      {
        label: 'Date Notified',
        value: audit.dateNotified,
        format: (v) => (v ? new Date(v).toLocaleDateString() : 'Not notified'),
      },
      {
        label: 'Audit Approved',
        value: audit.auditApproved,
        format: (v) => (v ? 'Yes' : 'No'),
        class: audit.auditApproved ? 'mt-1 text-sm font-medium text-green-600' : 'mt-1 text-sm font-medium text-red-600',
      },
      { label: 'Approved By', value: audit.approvedBy || 'N/A' },
      {
        label: 'Created Date',
        value: audit.createdDate,
        format: (v) => new Date(v).toLocaleDateString(),
      },
      { label: 'Created By', value: audit.createdBy },
      {
        label: 'Updated Date',
        value: audit.updatedDate,
        format: (v) => new Date(v).toLocaleDateString(),
      },
      { label: 'Updated By', value: audit.updatedBy },
    ]);

    this.previewDialogOpen.set(true);
  }

  /**
   * Handle row click
   */
  onRowClick(audit: AuditResponse): void {
    this.onPreview(audit);
  }

  /**
   * Close preview dialog
   */
  closePreview(): void {
    this.previewDialogOpen.set(false);
    this.selectedAudit.set(null);
  }
}
