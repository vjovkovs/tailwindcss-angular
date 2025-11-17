/**
 * Audit Edit Component (TanStack Query)
 *
 * Form for creating and editing audits
 * Uses DynamicFormComponent with grid layout and TanStack Query for data fetching
 */

import { Component, signal, inject, computed, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { z } from 'zod';

import { DynamicFormComponent, DynamicFormConfig } from '../../shared/components/dynamic-form';
import { auditsGetAuditByIdOptions, referenceAuditsGetReferenceAuditsOptions, referenceSuppliersGetAllSuppliersOptions } from '@/core/api/generated/@tanstack/angular-query-experimental.gen';
import type { SelectOption } from '../../shared/components/searchable-select';
import type { AuditResponse, PaginatedResponseOfAuditResponse, PaginatedResponseOfSupplierDetailsResponse } from '@/core/api/generated';

// Audit form schema (for creation)
const auditSchema = z.object({
  auditNumber: z.string().length(5, 'Audit number must be exactly 5 characters').describe('Audit Number'),
  supplierNumber: z.string().length(4, 'Supplier number must be exactly 4 characters').describe('Supplier Number'),
  leadUtilityCode: z.string().length(3, 'Lead utility code must be exactly 3 characters').describe('Lead Utility Code'),
  auditTypeId: z.number().int().positive('Audit type is required').describe('Audit Type ID'),
  fkPerNumb: z.number().int().nullable().optional().describe('FK Per Number'),
  contactPersonEmail: z.string().email('Invalid email').describe('Contact Person Email|email'),
  alternateContact: z.string().email('Invalid email').describe('Alternate Contact Email|email'),
  startDate: z.string().optional().describe('Start Date|date'),
  endDate: z.string().optional().describe('End Date|date'),
});

// Audit update schema (for editing)
const auditUpdateSchema = z.object({
  leadUtilityCode: z.string().length(3, 'Lead utility code must be exactly 3 characters').describe('Lead Utility Code'),
  fkPerNumb: z.number().int().nullable().optional().describe('FK Per Number'),
  contactPersonEmail: z.string().email('Invalid email').describe('Contact Person Email|email'),
  alternateContact: z.string().email('Invalid email').describe('Alternate Contact Email|email'),
  startDate: z.string().optional().describe('Start Date|date'),
  endDate: z.string().optional().describe('End Date|date'),
  dateNotified: z.string().optional().describe('Date Notified|date'),
  updatedBy: z.string().min(1, 'Updated by is required').describe('Updated By'),
});

type AuditFormData = z.infer<typeof auditSchema>;
type AuditUpdateFormData = z.infer<typeof auditUpdateSchema>;

@Component({
  selector: 'app-audit-edit',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent],
  template: `
    <div class="container mx-auto px-4 py-8 max-w-5xl">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center gap-4 mb-2">
          <button
            type="button"
            (click)="goBack()"
            class="btn btn-ghost btn-sm gap-2"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Audits
          </button>
        </div>
        <h1 class="text-3xl font-bold text-base-content">
          {{ isEditMode() ? 'Edit Audit' : 'New Audit' }}
        </h1>
        <p class="mt-2 text-base-content/60">
          {{ isEditMode() ? 'Update audit information' : 'Create a new audit' }}
        </p>
      </div>

      <!-- Loading state -->
      <div *ngIf="loading()" class="flex items-center justify-center py-12">
        <div class="flex items-center gap-2">
          <span class="loading loading-spinner loading-md"></span>
          <span>Loading audit...</span>
        </div>
      </div>

      <!-- Error state -->
      <div *ngIf="error()" class="alert alert-error mb-6">
        <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <span>{{ error() }}</span>
      </div>

      <!-- Form for creating new audit -->
      <div *ngIf="!loading() && !isEditMode()" class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <app-dynamic-form
            [config]="createFormConfig()"
            [initialData]="initialData()"
            (formSubmit)="onSubmit($event)"
            (formCancel)="goBack()"
          />
        </div>
      </div>

      <!-- Form for editing existing audit -->
      <div *ngIf="!loading() && isEditMode()" class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <app-dynamic-form
            [config]="updateFormConfig"
            [initialData]="initialData()"
            (formSubmit)="onSubmit($event)"
            (formCancel)="goBack()"
          />
        </div>
      </div>

      <!-- Success message -->
      <div *ngIf="successMessage()" class="toast toast-end">
        <div class="alert alert-success">
          <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span>{{ successMessage() }}</span>
        </div>
      </div>
    </div>
  `,
})
export class AuditEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Get audit ID from route
  private readonly auditId = signal<number | null>(null);

  // TanStack Query for audit data
  private auditQuery = injectQuery(() => auditsGetAuditByIdOptions({ path: { id: this.auditId() || 0 } }));

  // TanStack Query for NUPIC reference audit numbers (for searchable select)
  private referenceAuditsQuery = injectQuery(() => referenceAuditsGetReferenceAuditsOptions({ query: { pageSize: 1000 } }));

  // TanStack Query for supplier numbers (for searchable select)
  private suppliersListQuery = injectQuery(() => referenceSuppliersGetAllSuppliersOptions({ query: { pageSize: 1000 } }));

  // Computed state from query
  loading = computed(() => this.auditQuery.isLoading());
  error = computed(() => this.auditQuery.error()?.message || null);

  // Map NUPIC reference audit data to SelectOption format
  auditNumberOptions = computed((): SelectOption[] => {
    const audits = this.referenceAuditsQuery.data() as PaginatedResponseOfAuditResponse | undefined;
    if (!audits || !Array.isArray(audits.items)) return [];
    return audits.items
      .filter((audit: AuditResponse) => audit.auditNumber)
      .map((audit: AuditResponse) => ({
        label: `${audit.auditNumber} - ${audit.supplierNumber || 'N/A'}`,
        value: audit.auditNumber!
      }));
  });

  // Map supplier data to SelectOption format
  supplierNumberOptions = computed((): SelectOption[] => {
    const suppliers = this.suppliersListQuery.data() as PaginatedResponseOfSupplierDetailsResponse | undefined;
    if (!suppliers || !Array.isArray(suppliers.items)) return [];
    return suppliers.items
      .filter(supplier => supplier.supplierNumber)
      .map(supplier => ({
        label: `${supplier.supplierNumber} - ${supplier.supplierName || 'N/A'}`,
        value: supplier.supplierNumber!
      }));
  });

  // Form state
  successMessage = signal<string | null>(null);
  isEditMode = computed(() => !!this.auditId());

  initialData = computed(() => {
    const audit = this.auditQuery.data();
    if (!audit) return undefined;

    return {
      leadUtilityCode: audit.leadUtilityCode,
      fkPerNumb: audit.fkPerNumb,
      contactPersonEmail: audit.contactPersonEmail,
      alternateContact: audit.alternateContact,
      startDate: audit.startDate ? (audit.startDate instanceof Date ? audit.startDate.toISOString().split('T')[0] : audit.startDate) : undefined,
      endDate: audit.endDate ? (audit.endDate instanceof Date ? audit.endDate.toISOString().split('T')[0] : audit.endDate) : undefined,
      dateNotified: audit.dateNotified ? (audit.dateNotified instanceof Date ? audit.dateNotified.toISOString().split('T')[0] : audit.dateNotified) : undefined,
      updatedBy: audit.updatedBy,
    };
  });

  // Form configuration for creating new audit
  createFormConfig = computed((): DynamicFormConfig<typeof auditSchema.shape> => ({
    schema: auditSchema,
    layout: 'grid',
    columns: 2,
    fields: {
      auditNumber: {
        colSpan: 1,
        type: 'searchable-select',
        options: this.auditNumberOptions(),
        loading: this.referenceAuditsQuery.isLoading(),
        placeholder: 'Search audit number...'
      },
      supplierNumber: {
        colSpan: 1,
        type: 'searchable-select',
        options: this.supplierNumberOptions(),
        loading: this.suppliersListQuery.isLoading(),
        placeholder: 'Search supplier...'
      },
      leadUtilityCode: { colSpan: 1 },
      auditTypeId: { colSpan: 1 },
      fkPerNumb: { colSpan: 1 },
      contactPersonEmail: { colSpan: 2 },
      alternateContact: { colSpan: 2 },
      startDate: { colSpan: 1 },
      endDate: { colSpan: 1 },
    },
    submitLabel: 'Create Audit',
    showCancel: true,
  }));

  // Form configuration for updating existing audit
  updateFormConfig: DynamicFormConfig<typeof auditUpdateSchema.shape> = {
    schema: auditUpdateSchema,
    layout: 'grid',
    columns: 2,
    fields: {
      leadUtilityCode: { colSpan: 1 },
      fkPerNumb: { colSpan: 1 },
      contactPersonEmail: { colSpan: 2 },
      alternateContact: { colSpan: 2 },
      startDate: { colSpan: 1 },
      endDate: { colSpan: 1 },
      dateNotified: { colSpan: 1 },
      updatedBy: { colSpan: 1 },
    },
    submitLabel: 'Update Audit',
    showCancel: true,
  };

  constructor() {
    // Check if we're in edit mode and set audit ID
    effect(() => {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.auditId.set(parseInt(id, 10));
      }
    }, { allowSignalWrites: true });
  }

  /**
   * Handle form submission
   */
  onSubmit(data: AuditFormData | AuditUpdateFormData): void {
    console.log('Audit form submitted:', data);

    // TODO: Implement actual save logic
    // Use createAuditMutation() or updateAuditMutation()

    if (this.isEditMode() && this.auditId()) {
      this.successMessage.set('Audit updated successfully');
    } else {
      this.successMessage.set('Audit created successfully');
    }

    // Navigate back after 2 seconds
    setTimeout(() => {
      this.router.navigate(['/audits']);
    }, 2000);
  }

  /**
   * Navigate back to audits list
   */
  goBack(): void {
    this.router.navigate(['/audits']);
  }
}
