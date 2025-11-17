/**
 * Supplier Edit Component (TanStack Query)
 *
 * Form for creating and editing suppliers
 * Uses DynamicFormComponent with grid layout and TanStack Query for data fetching
 */

import { Component, signal, inject, computed, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { z } from 'zod';

import { DynamicFormComponent, DynamicFormConfig } from '../../shared/components/dynamic-form';
import { referenceSuppliersGetSupplierByNumberOptions } from '@/core/api/generated/@tanstack/angular-query-experimental.gen';

// Supplier form schema
const supplierSchema = z.object({
  supplierNumber: z.string().length(4, 'Supplier number must be exactly 4 characters').describe('Supplier Number'),
  supplierName: z.string().min(1, 'Supplier name is required').describe('Supplier Name'),
  city: z.string().min(1, 'City is required').describe('City'),
  state: z.string().length(2, 'State must be 2 characters').describe('State'),
  contact: z.string().optional().describe('Contact Person'),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')).describe('Contact Email|email'),
  isActive: z.boolean().default(true).describe('Active Status'),
  nupAudit: z.string().optional().describe('NUP Audit'),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

@Component({
  selector: 'app-supplier-edit',
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
            Back to Suppliers
          </button>
        </div>
        <h1 class="text-3xl font-bold text-base-content">
          {{ isEditMode() ? 'Edit Supplier' : 'New Supplier' }}
        </h1>
        <p class="mt-2 text-base-content/60">
          {{ isEditMode() ? 'Update supplier information' : 'Add a new supplier to the system' }}
        </p>
      </div>

      <!-- Loading state -->
      <div *ngIf="loading()" class="flex items-center justify-center py-12">
        <div class="flex items-center gap-2">
          <span class="loading loading-spinner loading-md"></span>
          <span>Loading supplier...</span>
        </div>
      </div>

      <!-- Error state -->
      <div *ngIf="error()" class="alert alert-error mb-6">
        <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <span>{{ error() }}</span>
      </div>

      <!-- Form -->
      <div *ngIf="!loading()" class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <app-dynamic-form
            [config]="formConfig"
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
export class SupplierEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Get supplier ID from route
  private readonly supplierId = signal<string | null>(null);

  // TanStack Query for supplier data
  private supplierQuery = injectQuery(() => referenceSuppliersGetSupplierByNumberOptions({ path: { supplierNumber: this.supplierId() ?? '-1' } }));

  // Computed state from query
  loading = computed(() => this.supplierQuery.isLoading());
  error = computed(() => this.supplierQuery.error()?.message || null);

  // Form state
  successMessage = signal<string | null>(null);
  isEditMode = computed(() => !!this.supplierId());

  initialData = computed(() => {
    const supplier = this.supplierQuery.data();
    if (!supplier) return undefined;

    return {
      supplierNumber: supplier.supplierNumber,
      supplierName: supplier.supplierName,
      city: supplier.city,
      state: supplier.state,
      contact: supplier.contact || undefined,
      contactEmail: supplier.contactEmail || undefined,
      isActive: supplier.isActive,
      nupAudit: supplier.nupAudit || undefined,
    };
  });

  // Form configuration with grid layout
  formConfig: DynamicFormConfig<typeof supplierSchema.shape> = {
    schema: supplierSchema,
    layout: 'grid',
    columns: 2,
    fields: {
      supplierNumber: { colSpan: 1 },
      supplierName: { colSpan: 2 },
      city: { colSpan: 1 },
      state: { colSpan: 1 },
      contact: { colSpan: 1 },
      contactEmail: { colSpan: 1 },
      nupAudit: { colSpan: 2 },
      isActive: { colSpan: 2 },
    },
    submitLabel: 'Save Supplier',
    showCancel: true,
  };

  constructor() {
    // Check if we're in edit mode and set supplier ID
    effect(() => {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.supplierId.set(id);
      }
    }, { allowSignalWrites: true });
  }

  /**
   * Handle form submission
   */
  onSubmit(data: SupplierFormData): void {
    console.log('Supplier form submitted:', data);

    // TODO: Implement actual save logic when API endpoints are available
    // Use updateSupplierMutation() or createSupplierMutation()

    const message = this.isEditMode()
      ? 'Supplier updated successfully'
      : 'Supplier created successfully';

    this.successMessage.set(message);

    // Navigate back after 2 seconds
    setTimeout(() => {
      this.router.navigate(['/suppliers']);
    }, 2000);
  }

  /**
   * Navigate back to suppliers list
   */
  goBack(): void {
    this.router.navigate(['/suppliers']);
  }
}
