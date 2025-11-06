/**
 * Supplier Edit Component
 *
 * Form for creating and editing suppliers
 * Uses DynamicFormComponent with grid layout
 */

import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { z } from 'zod';

import { DynamicFormComponent, DynamicFormConfig } from '../../shared/components/dynamic-form';
import { SuppliersService } from '../../core/api/services/suppliers.service';
import { SupplierDetailsResponse } from '../../core/api/models';

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
            class="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg class="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Suppliers
          </button>
        </div>
        <h1 class="text-3xl font-bold text-gray-900">
          {{ isEditMode() ? 'Edit Supplier' : 'New Supplier' }}
        </h1>
        <p class="mt-2 text-gray-600">
          {{ isEditMode() ? 'Update supplier information' : 'Add a new supplier to the system' }}
        </p>
      </div>

      <!-- Loading state -->
      <div *ngIf="loading()" class="flex items-center justify-center py-12">
        <div class="flex items-center gap-2 text-gray-500">
          <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading supplier...</span>
        </div>
      </div>

      <!-- Error state -->
      <div *ngIf="error()" class="rounded-md bg-red-50 p-4 mb-6">
        <div class="flex">
          <div class="shrink-0">
            <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error</h3>
            <div class="mt-2 text-sm text-red-700">{{ error() }}</div>
          </div>
        </div>
      </div>

      <!-- Form -->
      <div *ngIf="!loading()" class="bg-white rounded-lg shadow">
        <app-dynamic-form
          [config]="formConfig"
          [initialData]="initialData()"
          (formSubmit)="onSubmit($event)"
          (formCancel)="goBack()"
        />
      </div>

      <!-- Success message -->
      <div *ngIf="successMessage()" class="fixed bottom-4 right-4 rounded-md bg-green-50 p-4 shadow-lg">
        <div class="flex">
          <div class="shrink-0">
            <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-green-800">{{ successMessage() }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SupplierEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly suppliersService = inject(SuppliersService);

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  isEditMode = signal(false);
  supplierId = signal<string | null>(null);
  initialData = signal<Partial<SupplierFormData> | undefined>(undefined);

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

  ngOnInit(): void {
    // Check if we're in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.supplierId.set(id);
      this.loadSupplier(id);
    }
  }

  /**
   * Load supplier data for editing
   */
  loadSupplier(supplierNumber: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.suppliersService.getSupplier(supplierNumber).subscribe({
      next: (supplier) => {
        this.initialData.set({
          supplierNumber: supplier.supplierNumber,
          supplierName: supplier.supplierName,
          city: supplier.city,
          state: supplier.state,
          contact: supplier.contact || undefined,
          contactEmail: supplier.contactEmail || undefined,
          isActive: supplier.isActive,
          nupAudit: supplier.nupAudit || undefined,
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load supplier');
        this.loading.set(false);
      },
    });
  }

  /**
   * Handle form submission
   */
  onSubmit(data: SupplierFormData): void {
    console.log('Supplier form submitted:', data);

    // TODO: Implement actual save logic when API endpoints are available
    // For now, just show success message and navigate back

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
