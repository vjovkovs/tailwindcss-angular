import { FormControl, FormGroup } from '@angular/forms';
import { z } from 'zod';

/**
 * Utility functions for working with Angular Typed Forms and Zod
 */

/**
 * Creates a Zod validator for Angular FormControl
 * @param schema - Zod schema to validate against
 * @returns Angular validator function
 */
export function zodValidator<T>(schema: z.ZodSchema<T>) {
  return (control: FormControl) => {
    const result = schema.safeParse(control.value);
    if (result.success) {
      return null;
    }
    // Convert Zod errors to Angular validator errors
    const errors: Record<string, string> = {};
    result.error.errors.forEach((err) => {
      errors[err.path.join('.')] = err.message;
    });
    return errors;
  };
}

/**
 * Marks all controls in a FormGroup as touched
 * Useful for displaying validation errors on submit
 */
export function markFormGroupTouched(formGroup: FormGroup): void {
  Object.keys(formGroup.controls).forEach((key) => {
    const control = formGroup.get(key);
    control?.markAsTouched();

    if (control instanceof FormGroup) {
      markFormGroupTouched(control);
    }
  });
}

/**
 * Gets all error messages from a FormControl
 */
export function getControlErrors(control: FormControl): string[] {
  if (!control.errors) {
    return [];
  }
  return Object.values(control.errors);
}

/**
 * Checks if a form control should show an error
 */
export function shouldShowError(control: FormControl): boolean {
  return !!(control.invalid && (control.dirty || control.touched));
}
