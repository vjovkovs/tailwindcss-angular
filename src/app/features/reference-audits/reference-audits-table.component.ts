/**
 * ReferenceAudits Table Component (TanStack Query)
 */

import { Component, signal, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { injectQuery } from '@tanstack/angular-query-experimental';

import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { PreviewDialogComponent, PreviewField } from '../../shared/components/preview-dialog/preview-dialog.component';
import { TableConfig, TableColumn, TableAction } from '../../shared/components/data-table/data-table.types';
import type { AuditDetailsResponse  } from '@/core/api/generated';
import { referenceAuditsGetReferenceAuditsOptions } from '@/core/api/generated/@tanstack/angular-query-experimental.gen';

@Component({
  selector: 'app-reference-audits-table',
  standalone: true,
  imports: [CommonModule, DataTableComponent, PreviewDialogComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">ReferenceAudits</h1>
        <p class="mt-2 text-gray-600">Manage and view referenceaudits information</p>
      </div>

      <app-data-table
        [data]="referenceAudits()"
        [config]="tableConfig()"
        [loading]="loading()"
        (rowClick)="onRowClick($event)"
      />

      <app-preview-dialog
        [isOpen]="previewDialogOpen()"
        [title]="'ReferenceAudits Details'"
        [fields]="previewFields()"
        (close)="closePreview()"
      />

      @if (error()){
      <!-- Error message -->
      <div class="mt-4 rounded-md bg-red-50 p-4">
        <p class="text-red-600">{{ error() }}</p>
      </div>
      }
    </div>
  `,
})
export class ReferenceAuditsTableComponent {
  private readonly router = inject(Router);

  private referenceAuditsQuery = injectQuery(() =>
    referenceAuditsGetReferenceAuditsOptions({ query: { pageNumber: 1, pageSize: 100 } })
  );

  referenceAudits = computed(() => {
      const items = this.referenceAuditsQuery.data()?.items || [];
      
      // Debug invalid dates
      items.forEach((item, index) => {
        if (item.auditDate && !this.isValidDate(item.auditDate)) {
          console.log(`Invalid auditDate at index ${index}:`, item.auditDate);
        }
        if (item.entranceDate && !this.isValidDate(item.entranceDate)) {
          console.log(`Invalid entranceDate at index ${index}:`, item.entranceDate);
        }
        if (item.closeDate && !this.isValidDate(item.closeDate)) {
          console.log(`Invalid closeDate at index ${index}:`, item.closeDate);
        }
      });
      
      return items;
    });
    private isValidDate(value: any): boolean {
      try {
        const date = new Date(value);
        return !isNaN(date.getTime());
      } catch {
        return false;
      }
    }
  loading = computed(() => this.referenceAuditsQuery.isLoading());
  error = computed(() => this.referenceAuditsQuery.error()?.message || null);

  previewDialogOpen = signal(false);
  selectedReferenceAudits = signal<AuditDetailsResponse | null>(null);

  tableConfig = signal<TableConfig<AuditDetailsResponse>>({
    columns: [
      { label: 'Audit Number', field: 'auditNumber', sortable: true },
      { label: 'Supplier Number', field: 'supplierNumber', sortable: true },
      { label: 'Supplier Name', field: 'supplierName', sortable: true },
      { label: 'Lead Utility Code', field: 'leadUtilityCode', sortable: true },
      { label: 'Lead Utility Name', field: 'leadUtilityName', sortable: true },
      { 
        label: 'Audit Date', 
        field: 'auditDate', 
        sortable: true, 
        format: (value) => this.formatDate(value)
      },
      { 
        label: 'Entrance Date', 
        field: 'entranceDate', 
        sortable: true, 
        format: (value) => this.formatDate(value)
      },
      { 
        label: 'Close Date', 
        field: 'closeDate', 
        sortable: true, 
        format: (value) => this.formatDate(value)
      },
      { label: 'Person Performing Audit', field: 'personPerformingAudit', sortable: true },
      { label: 'Scheduled Month', field: 'scheduledMonth', sortable: true },
      { label: 'Scheduled Year', field: 'scheduledYear', sortable: true },
      { label: 'Is Closed', field: 'isClosed', sortable: true },
      { label: 'Is Scheduled', field: 'isScheduled', sortable: true }      
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
    searchPlaceholder: 'Search referenceaudits...',
    pageable: true,
    onNew: () => this.router.navigate(['/reference-audits/new']),
    newButtonLabel: 'Add ReferenceAudits',
  });

  previewFields = signal<PreviewField[]>([]);

  onEdit(item: AuditDetailsResponse): void {
    this.router.navigate(['/reference-audits', item.auditNumber, 'edit']);
  }

  onRowClick(item: AuditDetailsResponse): void {
    this.selectedReferenceAudits.set(item);
    this.previewFields.set([
      { label: 'Audit Number', value: item.auditNumber },
      { label: 'Supplier Number', value: item.supplierNumber },
      { label: 'Supplier Name', value: item.supplierName },
      { label: 'Lead Utility Code', value: item.leadUtilityCode },
      { label: 'Lead Utility Name', value: item.leadUtilityName },
      { 
        label: 'Audit Date', 
        value: item.auditDate,
        format: (v) => this.formatDate(v)
      },
      { 
        label: 'Entrance Date', 
        value: item.entranceDate,
        format: (v) => this.formatDate(v)
      },
      { 
        label: 'Close Date', 
        value: item.closeDate,
        format: (v) => this.formatDate(v)
      },
      { label: 'Person Performing Audit', value: item.personPerformingAudit },
      { label: 'Scheduled Month', value: item.scheduledMonth },
      { label: 'Scheduled Year', value: item.scheduledYear },
      { label: 'Is Closed', value: item.isClosed },
      { label: 'Is Scheduled', value: item.isScheduled },
    ]);
    this.previewDialogOpen.set(true);
  }

  closePreview(): void {
    this.previewDialogOpen.set(false);
    this.selectedReferenceAudits.set(null);
  }

  private formatDate(value: any): string {
    if (!value) return 'N/A';
    
    // Handle different date formats
    try {
      const date = new Date(value);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  }
}
