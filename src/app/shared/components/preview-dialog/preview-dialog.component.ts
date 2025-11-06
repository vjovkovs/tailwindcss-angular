/**
 * Preview Dialog Component
 *
 * A reusable modal dialog for previewing data
 * Uses HeadlessUI-style patterns with Angular Signals
 */

import { CommonModule } from '@angular/common';
import { Component, input, output, signal, effect } from '@angular/core';

export interface PreviewField {
  label: string;
  value: any;
  format?: (value: any) => string;
  class?: string;
}

@Component({
  selector: 'app-preview-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preview-dialog.component.html',
  styleUrls: ['./preview-dialog.component.css'],
})
export class PreviewDialogComponent {
  // Inputs
  isOpen = input.required<boolean>();
  title = input<string>('Preview');
  fields = input<PreviewField[]>([]);
  data = input<any>(null);

  // Outputs
  close = output<void>();

  // Internal state
  showDialog = signal(false);

  constructor() {
    // Sync internal state with input
    effect(() => {
      this.showDialog.set(this.isOpen());
    });

    // Prevent body scroll when dialog is open
    effect(() => {
      if (this.showDialog()) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  /**
   * Close the dialog
   */
  closeDialog(): void {
    this.close.emit();
  }

  /**
   * Handle backdrop click
   */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeDialog();
    }
  }

  /**
   * Get formatted field value
   */
  getFieldValue(field: PreviewField): string {
    const value = field.value;
    if (field.format) {
      return field.format(value);
    }
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return value.toString();
  }
}
