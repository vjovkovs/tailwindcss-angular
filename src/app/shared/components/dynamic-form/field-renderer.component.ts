import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FieldConfig } from './types';

/**
 * Field Renderer Component
 * Renders a form field based on its configuration
 */
@Component({
  selector: 'app-field-renderer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './field-renderer.component.html',
})
export class FieldRendererComponent {
  @Input() field!: FieldConfig;
  @Input() control!: FormControl;

  /**
   * Get error message for the field
   */
  getErrorMessage(): string | null {
    if (!this.control.invalid || (!this.control.dirty && !this.control.touched)) {
      return null;
    }

    const errors = this.control.errors;
    if (!errors) {
      return null;
    }

    // Return first error message
    return Object.values(errors)[0] as string;
  }

  /**
   * Check if field should show error state
   */
  hasError(): boolean {
    return !!(
      this.control.invalid &&
      (this.control.dirty || this.control.touched)
    );
  }
}
