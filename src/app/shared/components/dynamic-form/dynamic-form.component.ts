import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, FormArray, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { z } from 'zod';
import { FieldRendererComponent } from './field-renderer.component';
import { ArrayFieldRendererComponent } from './array-field-renderer.component';
import { DynamicFormConfig, FieldConfig } from './types';
import { extractFieldsFromSchema, createZodValidator, evaluateCondition } from './zod-utils';

/**
 * Dynamic Form Component
 *
 * Automatically generates a form from a Zod schema with:
 * - Type inference
 * - Automatic validation
 * - Customizable field configurations
 * - Tailwind styling
 *
 * Usage:
 * ```html
 * <app-dynamic-form
 *   [config]="formConfig"
 *   [initialData]="userData"
 *   (formSubmit)="onSubmit($event)"
 *   (formCancel)="onCancel()"
 * />
 * ```
 */
@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FieldRendererComponent, ArrayFieldRendererComponent],
  templateUrl: './dynamic-form.component.html',
})
export class DynamicFormComponent<T extends z.ZodRawShape> implements OnInit {
  @Input() config!: DynamicFormConfig<T>;
  @Input() initialData?: Partial<z.infer<z.ZodObject<T>>>;
  @Input() loading = false;

  @Output() formSubmit = new EventEmitter<z.infer<z.ZodObject<T>>>();
  @Output() formCancel = new EventEmitter<void>();

  formGroup!: FormGroup;
  fields = signal<FieldConfig[]>([]);

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Initialize the form from the schema
   */
  private initializeForm(): void {
    // Extract field configurations from schema
    const extractedFields = extractFieldsFromSchema(
      this.config.schema,
      this.config.fields
    );
    this.fields.set(extractedFields);

    // Build FormGroup
    const formControls: Record<string, AbstractControl> = {};

    for (const field of extractedFields) {
      const zodType = this.config.schema.shape[field.name as keyof T];
      const initialValue = this.getInitialValue(field);

      // Phase 2: Handle array fields
      if (field.type === 'array') {
        formControls[field.name] = this.createArrayControl(field, initialValue);
        continue;
      }

      // Phase 2: Handle nested object fields
      if (field.type === 'object') {
        formControls[field.name] = this.createNestedFormGroup(field, initialValue);
        continue;
      }

      // Create validators
      const validators = [createZodValidator(zodType)];

      // Add required validator if needed (for better UX)
      if (field.required) {
        validators.push(Validators.required);
      }

      formControls[field.name] = new FormControl(initialValue, {
        validators,
        nonNullable: field.required,
      });
    }

    this.formGroup = new FormGroup(formControls);
  }

  /**
   * Phase 2: Create a FormArray for array fields
   */
  private createArrayControl(field: FieldConfig, initialValue: any[]): FormArray {
    const formArray = new FormArray<any>([]);

    // If we have initial data, populate the array
    if (Array.isArray(initialValue) && initialValue.length > 0) {
      for (const item of initialValue) {
        if (field.itemFields?.type === 'object') {
          // Create FormGroup for object items
          formArray.push(this.createNestedFormGroup(field.itemFields, item));
        } else {
          // Create FormControl for primitive items
          const validators = field.itemSchema ? [createZodValidator(field.itemSchema)] : [];
          formArray.push(new FormControl(item, validators));
        }
      }
    }

    return formArray;
  }

  /**
   * Phase 2: Create a FormGroup for nested objects
   */
  private createNestedFormGroup(field: FieldConfig, initialValue: any): FormGroup {
    const formControls: Record<string, FormControl> = {};
    const fields = field.fields || [];

    for (const nestedField of fields) {
      const zodType = field.schema?.shape[nestedField.name];
      const validators = zodType ? [createZodValidator(zodType)] : [];

      if (nestedField.required) {
        validators.push(Validators.required);
      }

      const value = initialValue && nestedField.name in initialValue
        ? initialValue[nestedField.name]
        : this.getInitialValue(nestedField);

      formControls[nestedField.name] = new FormControl(value, {
        validators,
        nonNullable: nestedField.required,
      });
    }

    return new FormGroup(formControls);
  }

  /**
   * Get initial value for a field
   */
  private getInitialValue(field: FieldConfig): any {
    // Priority: initialData > defaultValue > type default
    if (this.initialData && field.name in this.initialData) {
      return this.initialData[field.name as keyof typeof this.initialData];
    }

    if (field.defaultValue !== undefined) {
      return field.defaultValue;
    }

    // Phase 2: Handle array defaults
    if (field.type === 'array') {
      return [];
    }

    // Phase 2: Handle object defaults
    if (field.type === 'object') {
      return {};
    }

    // Type-specific defaults
    if (field.type === 'checkbox') {
      return false;
    }

    if (field.type === 'number') {
      return field.min !== undefined ? field.min : null;
    }

    return '';
  }

  /**
   * Phase 2: Check if a field should be visible based on its condition
   */
  isFieldVisible(field: FieldConfig): boolean {
    if (!field.condition) {
      return true;
    }

    const formValues = this.formGroup.getRawValue();
    return evaluateCondition(field.condition, formValues);
  }

  /**
   * Get FormControl for a field
   */
  getControl(fieldName: string): FormControl {
    return this.formGroup.get(fieldName) as FormControl;
  }

  /**
   * Phase 2: Get FormArray for an array field
   */
  getFormArray(fieldName: string): FormArray {
    return this.formGroup.get(fieldName) as FormArray;
  }

  /**
   * Phase 2: Get FormGroup for a nested object field
   */
  getNestedFormGroup(fieldName: string): FormGroup {
    return this.formGroup.get(fieldName) as FormGroup;
  }

  /**
   * Phase 2: Get nested control from a FormGroup
   */
  getNestedControl(groupName: string, fieldName: string): FormControl {
    const group = this.getNestedFormGroup(groupName);
    return group.get(fieldName) as FormControl;
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.formGroup.invalid) {
      // Mark all fields as touched to show errors
      Object.keys(this.formGroup.controls).forEach((key) => {
        const control = this.formGroup.get(key);
        control?.markAsTouched();
      });
      return;
    }

    // Parse with Zod to ensure type safety
    const result = this.config.schema.safeParse(this.formGroup.getRawValue());

    if (result.success) {
      this.formSubmit.emit(result.data);
    } else {
      // This shouldn't happen if validators are set up correctly
      console.error('Form validation failed:', result.error);
    }
  }

  /**
   * Handle form cancellation
   */
  onCancel(): void {
    this.formCancel.emit();
  }

  /**
   * Get submit button label
   */
  get submitLabel(): string {
    return this.config.submitLabel || 'Submit';
  }

  /**
   * Get cancel button label
   */
  get cancelLabel(): string {
    return this.config.cancelLabel || 'Cancel';
  }

  /**
   * Check if cancel button should be shown
   */
  get showCancel(): boolean {
    return this.config.showCancel !== false;
  }
}
