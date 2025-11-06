/**
 * Audit Edit Component
 *
 * Form for creating and editing audits
 * Uses DynamicFormComponent with grid layout
 */

import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { z } from 'zod';

import { DynamicFormComponent, DynamicFormConfig } from '../../shared/components/dynamic-form';
import { AuditsService } from '../../core/api/services/audits.service';
import { AuditResponse } from '../../core/api/models';

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
            class="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg class="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Audits
          </button>
        </div>
        <h1 class="text-3xl font-bold text-gray-900">
          {{ isEditMode() ? 'Edit Audit' : 'New Audit' }}
        </h1>
        <p class="mt-2 text-gray-600">
          {{ isEditMode() ? 'Update audit information' : 'Create a new audit' }}
        </p>
      </div>

      <!-- Loading state -->
      <div *ngIf="loading()" class="flex items-center justify-center py-12">
        <div class="flex items-center gap-2 text-gray-500">
          <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading audit...</span>
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

      <!-- Form for creating new audit -->
      <div *ngIf="!loading() && !isEditMode()" class="bg-white rounded-lg shadow">
        <app-dynamic-form
          [config]="createFormConfig"
          [initialData]="initialData()"
          (formSubmit)="onSubmit($event)"
          (formCancel)="goBack()"
        />
      </div>

      <!-- Form for editing existing audit -->
      <div *ngIf="!loading() && isEditMode()" class="bg-white rounded-lg shadow">
        <app-dynamic-form
          [config]="updateFormConfig"
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
export class AuditEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auditsService = inject(AuditsService);

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  isEditMode = signal(false);
  auditId = signal<number | null>(null);
  initialData = signal<Partial<AuditFormData | AuditUpdateFormData> | undefined>(undefined);

  // Form configuration for creating new audit
  createFormConfig: DynamicFormConfig<typeof auditSchema.shape> = {
    schema: auditSchema,
    layout: 'grid',
    columns: 2,
    fields: {
      auditNumber: { colSpan: 1 },
      supplierNumber: { colSpan: 1 },
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
  };

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

  ngOnInit(): void {
    // Check if we're in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.auditId.set(parseInt(id, 10));
      this.loadAudit(parseInt(id, 10));
    }
  }

  /**
   * Load audit data for editing
   */
  loadAudit(auditId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.auditsService.getAuditById(auditId).subscribe({
      next: (audit: any) => {
        this.initialData.set({
          leadUtilityCode: audit.leadUtilityCode,
          fkPerNumb: audit.fkPerNumb,
          contactPersonEmail: audit.contactPersonEmail,
          alternateContact: audit.alternateContact,
          startDate: audit.startDate || undefined,
          endDate: audit.endDate || undefined,
          dateNotified: audit.dateNotified || undefined,
          updatedBy: audit.updatedBy,
        });
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err.message || 'Failed to load audit');
        this.loading.set(false);
      },
    });
  }

  /**
   * Handle form submission
   */
  onSubmit(data: AuditFormData | AuditUpdateFormData): void {
    console.log('Audit form submitted:', data);

    if (this.isEditMode() && this.auditId()) {
      // TODO: Implement update logic
      this.successMessage.set('Audit updated successfully');
    } else {
      // TODO: Implement create logic
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
