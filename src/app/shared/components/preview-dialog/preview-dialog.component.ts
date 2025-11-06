/**
 * Preview Dialog Component
 *
 * Uses the ui.dialog component for displaying key-value preview data
 * DRY implementation that works with any data type
 */

import { Component, Input, Output, EventEmitter, signal, computed, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DialogComponent,
  DialogTitleDirective,
  DialogContentDirective,
  DialogActionsDirective,
} from '../../../ui/dialog';

export interface PreviewField {
  label: string;
  value: any;
  format?: (value: any) => string;
  class?: string;
}

@Component({
  selector: 'app-preview-dialog',
  standalone: true,
  imports: [CommonModule, DialogComponent, DialogTitleDirective, DialogContentDirective, DialogActionsDirective],
  template: `
    <app-dialog [(open)]="dialogOpen" [closeOnBackdrop]="true" (openChange)="onOpenChange($event)">
      <h2 dialog-title class="text-xl font-semibold text-gray-900 px-6 pt-6 pb-4">
        {{ _title() }}
      </h2>

      <div dialog-content class="px-6 py-0">
        <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          @for (field of _fields(); track field.label) {
            <div class="flex flex-col">
              <dt class="text-sm font-medium text-gray-500">{{ field.label }}</dt>
              <dd [class]="field.class || 'mt-1 text-sm text-gray-900'">
                {{ formatValue(field) }}
              </dd>
            </div>
          }
        </dl>
      </div>

      <div dialog-actions class="px-6 pb-6 pt-6">
        <button
          type="button"
          (click)="closeDialog()"
          class="btn btn-sm"
        >
          Close
        </button>
      </div>
    </app-dialog>
  `,
})
export class PreviewDialogComponent {
  @Input() set isOpen(value: boolean) {
    this.dialogOpen = value;
  }
  get isOpen(): boolean {
    return this.dialogOpen;
  }

  @Input() set title(value: string) {
    this._title.set(value);
  }

  @Input() set fields(value: PreviewField[]) {
    this._fields.set(value);
  }

  @Output() close = new EventEmitter<void>();

  protected dialogOpen = false;
  protected _title = signal('Details');
  protected _fields = signal<PreviewField[]>([]);

  protected formatValue(field: PreviewField): string {
    if (field.format) {
      return field.format(field.value);
    }
    if (field.value === null || field.value === undefined) {
      return 'N/A';
    }
    if (typeof field.value === 'boolean') {
      return field.value ? 'Yes' : 'No';
    }
    return String(field.value);
  }

  protected onOpenChange(open: boolean): void {
    if (!open) {
      this.close.emit();
    }
  }

  protected closeDialog(): void {
    this.dialogOpen = false;
    this.close.emit();
  }
}
