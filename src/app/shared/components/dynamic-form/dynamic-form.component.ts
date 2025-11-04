import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { z } from 'zod';
import { FieldRendererComponent } from './field-renderer.component';
import { DynamicFormConfig, FieldConfig } from './types';
import { extractFieldsFromSchema, createZodValidator } from './zod-utils';

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
  imports: [CommonModule, ReactiveFormsModule, FieldRendererComponent],
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
    const formControls: Record<string, FormControl> = {};

    for (const field of extractedFields) {
      const zodType = this.config.schema.shape[field.name as keyof T];
      const initialValue = this.getInitialValue(field);

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
   * Get FormControl for a field
   */
  getControl(fieldName: string): FormControl {
    return this.formGroup.get(fieldName) as FormControl;
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
