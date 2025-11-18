/**
 * Bookmarks Edit Component (TanStack Query)
 *
 * Form for creating and editing bookmarks
 * Uses DynamicFormComponent with grid layout and TanStack Query for data fetching
 */

import { Component, signal, inject, computed, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { z } from 'zod';

import { DynamicFormComponent, DynamicFormConfig } from '../../shared/components/dynamic-form';
import { bookmarksGetBookmarkTemplateOptions } from '@/core/api/generated/@tanstack/angular-query-experimental.gen';
import type { SelectOption } from '../../shared/components/searchable-select';

// Form schema
const bookmarksSchema = z.object({
  id: z.number().optional().describe('Id'),
  name: z.string().min(1).optional().describe('Name'),
  description: z.string().min(1).optional().describe('Description'),
  isActive: z.boolean().default(true).optional().describe('Is Active'),
  items: z.string().optional().describe('Items'),
});

type BookmarksFormData = z.infer<typeof bookmarksSchema>;

@Component({
  selector: 'app-bookmarks-edit',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent],
  template: `
    <div class="container mx-auto px-4 py-8 max-w-5xl">
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
            Back to Bookmarks
          </button>
        </div>
        <h1 class="text-3xl font-bold text-base-content">
          {{ isEditMode() ? 'Edit Bookmarks' : 'New Bookmarks' }}
        </h1>
      </div>

      <div *ngIf="loading()" class="flex items-center justify-center py-12">
        <span class="loading loading-spinner loading-md"></span>
      </div>

      <div *ngIf="error()" class="alert alert-error mb-6">
        <span>{{ error() }}</span>
      </div>

      @if(!loading()){
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <app-dynamic-form
            [config]="formConfig()"
            [initialData]="initialData()"
            (formSubmit)="onSubmit($event)"
            (formCancel)="goBack()"
          />
        </div>
      </div>
      }

      @if (successMessage()){
      <div class="toast toast-end">
        <div class="alert alert-success">
          <span>{{ successMessage() }}</span>
        </div>
      </div>
      }
    </div>
  `,
})
export class BookmarksEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly bookmarksId = signal<number | null>(null);

  private bookmarksQuery = injectQuery(() =>
    bookmarksGetBookmarkTemplateOptions({ path: { auditTypeId: this.bookmarksId() || 0 } })
  );


  loading = computed(() => this.bookmarksQuery?.isLoading() || false);
  error = computed(() => this.bookmarksQuery?.error()?.message || null);
  successMessage = signal<string | null>(null);
  isEditMode = computed(() => !!this.bookmarksId());

  initialData = computed(() => {
    const data = this.bookmarksQuery?.data();
    if (!data) return undefined;

    return {
      id: data.id ?? undefined,
      name: data.name ?? undefined,
      description: data.description ?? undefined,
      isActive: data.isActive ?? undefined,
      items: data.items ?? undefined,
    };
  });

  formConfig = computed((): DynamicFormConfig<typeof bookmarksSchema.shape> => ({
    schema: bookmarksSchema,
    layout: 'grid',
    columns: 2,
    fields: {
      id: {
        colSpan: 1,
      },
      name: {
        colSpan: 2,
      },
      description: {
        colSpan: 2,
      },
      isActive: {
        colSpan: 1,
        type: 'checkbox',
      },
      items: {
        colSpan: 1,
      },
    },
    submitLabel: this.isEditMode() ? 'Update Bookmarks' : 'Create Bookmarks',
    showCancel: true,
  }));

  constructor() {
    effect(() => {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.bookmarksId.set(Number(id));
      }
    }, { allowSignalWrites: true });
  }

  onSubmit(data: BookmarksFormData): void {
    console.log('Form submitted:', data);
    // TODO: Implement save logic with mutations
    this.successMessage.set('Bookmarks saved successfully');

    setTimeout(() => {
      this.router.navigate(['/bookmarks']);
    }, 2000);
  }

  goBack(): void {
    this.router.navigate(['/bookmarks']);
  }
}
