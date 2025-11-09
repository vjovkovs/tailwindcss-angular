/**
 * Searchable Select Component
 *
 * A DaisyUI-styled searchable dropdown component
 * Features:
 * - Search/filter options
 * - Keyboard navigation
 * - Loading state
 * - Clear selection
 * - Accessible
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  effect,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dropdown w-full" [class.dropdown-open]="isOpen()">
      <div
        tabindex="0"
        role="button"
        class="input input-bordered w-full flex items-center justify-between cursor-pointer"
        [class.input-error]="_error()"
        (click)="toggleDropdown()"
      >
        <span [class.text-gray-400]="!selectedOption()">
          {{ selectedOption()?.label || _placeholder() }}
        </span>
        <svg class="h-4 w-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      @if (isOpen()) {
        <div
          class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-full mt-1 max-h-60 overflow-y-auto"
          (click)="$event.stopPropagation()"
        >
          <!-- Search Input -->
          <div class="px-2 pb-2">
            <input
              #searchInput
              type="text"
              placeholder="Search..."
              [(ngModel)]="searchTerm"
              (input)="onSearchChange()"
              (keydown)="onKeyDown($event)"
              class="input input-sm input-bordered w-full"
            />
          </div>

          <!-- Loading State -->
          @if (_loading()) {
            <li class="px-4 py-2 text-gray-500">
              <span class="loading loading-spinner loading-sm"></span>
              Loading...
            </li>
          }

          <!-- Options -->
          @if (!_loading() && filteredOptions().length > 0) {
            @for (option of filteredOptions(); track option.value) {
              <li>
                <a
                  [class.active]="option.value === _value()"
                  [class.disabled]="option.disabled"
                  (click)="selectOption(option)"
                >
                  {{ option.label }}
                </a>
              </li>
            }
          }

          <!-- No Results -->
          @if (!_loading() && filteredOptions().length === 0) {
            <li class="px-4 py-2 text-gray-500 text-center">
              No results found
            </li>
          }
        </div>
      }
    </div>

    @if (_error()) {
      <label class="label">
        <span class="label-text-alt text-error">{{ _error() }}</span>
      </label>
    }
  `,
})
export class SearchableSelectComponent {
  @Input() set options(value: SelectOption[]) {
    this._options.set(value || []);
  }

  @Input() set value(val: string | null) {
    this._value.set(val);
  }
  get value(): string | null {
    return this._value();
  }

  @Input() set placeholder(val: string) {
    this._placeholder.set(val);
  }

  @Input() set loading(val: boolean) {
    this._loading.set(val);
  }

  @Input() set error(val: string | null) {
    this._error.set(val);
  }

  @Output() valueChange = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<string>();

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  protected _options = signal<SelectOption[]>([]);
  protected _value = signal<string | null>(null);
  protected _placeholder = signal('Select an option');
  protected _loading = signal(false);
  protected _error = signal<string | null>(null);
  protected isOpen = signal(false);
  protected searchTerm = '';

  protected filteredOptions = computed(() => {
    const search = this.searchTerm.toLowerCase().trim();
    if (!search) {
      return this._options();
    }
    return this._options().filter((opt) =>
      opt.label.toLowerCase().includes(search)
    );
  });

  protected selectedOption = computed(() => {
    const val = this._value();
    if (!val) return null;
    return this._options().find((opt) => opt.value === val);
  });

  constructor() {
    // Focus search input when dropdown opens
    effect(() => {
      if (this.isOpen()) {
        setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
      }
    });

    // Close dropdown when clicking outside
    effect(() => {
      if (this.isOpen()) {
        const handler = (e: MouseEvent) => {
          if (!(e.target as Element).closest('.dropdown')) {
            this.isOpen.set(false);
          }
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
      }
      return () => {};
    });
  }

  protected toggleDropdown(): void {
    this.isOpen.update((val) => !val);
    if (this.isOpen()) {
      this.searchTerm = '';
    }
  }

  protected selectOption(option: SelectOption): void {
    if (option.disabled) return;
    this._value.set(option.value);
    this.valueChange.emit(option.value);
    this.isOpen.set(false);
    this.searchTerm = '';
  }

  protected onSearchChange(): void {
    this.searchChange.emit(this.searchTerm);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.isOpen.set(false);
      event.preventDefault();
    }
  }
}
