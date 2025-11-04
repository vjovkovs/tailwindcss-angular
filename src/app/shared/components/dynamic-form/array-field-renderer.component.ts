import { Component, input, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FieldConfig } from './types';
import { createZodValidator } from './zod-utils';
import { FieldRendererComponent } from './field-renderer.component';

/**
 * Component for rendering array fields with add/remove functionality
 * Phase 2: Supports both primitive and object arrays
 */
@Component({
  selector: 'app-array-field-renderer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FieldRendererComponent],
  template: `
    <div class="space-y-3">
      <label class="block text-sm font-medium text-gray-700">
        {{ field().label }}
        @if (field().required) {
          <span class="text-error">*</span>
        }
      </label>

      @if (field().hint) {
        <p class="text-xs text-gray-500 -mt-2">{{ field().hint }}</p>
      }

      <div class="space-y-3">
        @for (itemControl of getFormArray().controls; track $index) {
          <div class="flex items-start gap-2 p-3 border border-gray-200 rounded-md bg-gray-50">
            <div class="flex-1">
              @if (isObjectArray()) {
                <!-- Nested object fields -->
                <div class="space-y-3">
                  @for (nestedField of field().itemFields?.fields; track nestedField.name) {
                    <app-field-renderer
                      [field]="nestedField"
                      [control]="getNestedControl(itemControl, nestedField.name)"
                    />
                  }
                </div>
              } @else {
                <!-- Primitive field -->
                <app-field-renderer
                  [field]="getPrimitiveFieldConfig($index)"
                  [control]="$any(itemControl)"
                />
              }
            </div>

            <button
              type="button"
              (click)="removeItem($index)"
              class="mt-1 p-1 text-error hover:bg-error/10 rounded transition-colors"
              title="Remove item"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        }
      </div>

      @if (canAddMore()) {
        <button
          type="button"
          (click)="addItem()"
          class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add {{ field().label }}
        </button>
      }

      @if (field().minItems && getFormArray().length < field().minItems!) {
        <p class="text-sm text-error">
          Minimum {{ field().minItems }} items required
        </p>
      }
    </div>
  `,
})
export class ArrayFieldRendererComponent implements OnInit {
  field = input.required<FieldConfig>();
  formArray = input.required<FormArray>();

  ngOnInit(): void {
    // Ensure at least minItems are present
    const minItems = this.field().minItems || 0;
    while (this.getFormArray().length < minItems) {
      this.addItem();
    }
  }

  getFormArray(): FormArray {
    return this.formArray();
  }

  isObjectArray(): boolean {
    return this.field().itemFields?.type === 'object';
  }

  getPrimitiveFieldConfig(index: number): FieldConfig {
    return {
      ...this.field().itemFields!,
      name: `${this.field().name}[${index}]`,
      label: `Item ${index + 1}`,
    };
  }

  getNestedControl(itemControl: any, fieldName: string): FormControl {
    const formGroup = itemControl as FormGroup;
    return formGroup.get(fieldName) as FormControl;
  }

  addItem(): void {
    const formArray = this.getFormArray();
    const itemControl = this.createItemControl();
    formArray.push(itemControl);
  }

  removeItem(index: number): void {
    const formArray = this.getFormArray();
    const minItems = this.field().minItems || 0;

    if (formArray.length > minItems) {
      formArray.removeAt(index);
    }
  }

  canAddMore(): boolean {
    const maxItems = this.field().maxItems;
    if (!maxItems) {
      return true;
    }
    return this.getFormArray().length < maxItems;
  }

  private createItemControl(): FormControl | FormGroup {
    const itemSchema = this.field().itemSchema;

    if (this.isObjectArray()) {
      // Create a FormGroup for object items
      const formControls: Record<string, FormControl> = {};
      const fields = this.field().itemFields?.fields || [];

      for (const field of fields) {
        const zodType = this.field().itemFields?.schema?.shape[field.name];
        const validators = zodType ? [createZodValidator(zodType)] : [];

        if (field.required) {
          validators.push(Validators.required);
        }

        formControls[field.name] = new FormControl(field.defaultValue || '', validators);
      }

      return new FormGroup(formControls);
    } else {
      // Create a FormControl for primitive items
      const validators = itemSchema ? [createZodValidator(itemSchema)] : [];
      if (this.field().required) {
        validators.push(Validators.required);
      }

      return new FormControl('', validators);
    }
  }
}
