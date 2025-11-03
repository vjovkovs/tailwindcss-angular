import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  effect,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { generateId } from '../../shared/utils/common.utils';

/**
 * Headless Dialog Component
 *
 * Features:
 * - Escape to close
 * - Focus trap (returns focus on close)
 * - ARIA attributes for accessibility
 * - Backdrop click to close (optional)
 * - Keyboard navigation
 *
 * Usage:
 * ```html
 * <app-dialog [(open)]="isOpen" [closeOnBackdrop]="true">
 *   <h2 dialog-title>Dialog Title</h2>
 *   <div dialog-content>
 *     <p>Dialog content goes here</p>
 *   </div>
 *   <div dialog-actions>
 *     <button (click)="isOpen = false">Close</button>
 *   </div>
 * </app-dialog>
 * ```
 */
@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open()) {
      <div
        class="dialog-backdrop"
        [class]="backdropClass()"
        (click)="onBackdropClick()"
        [@fadeIn]
      >
        <div
          #dialogElement
          class="dialog-container"
          [class]="containerClass()"
          role="dialog"
          [attr.aria-modal]="true"
          [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="contentId"
          (click)="$event.stopPropagation()"
          (keydown.escape)="onEscape()"
        >
          <ng-content />
        </div>
      </div>
    }
  `,
  styles: [`
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      z-index: 50;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .dialog-container {
      position: relative;
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
      max-width: 32rem;
      width: 100%;
      max-height: calc(100vh - 2rem);
      overflow-y: auto;
    }
  `],
})
export class DialogComponent implements AfterViewInit, OnDestroy {
  @Input() set open(value: boolean) {
    this._open.set(value);
  }
  get open(): boolean {
    return this._open();
  }

  @Output() openChange = new EventEmitter<boolean>();
  @Input() closeOnBackdrop = true;
  @Input() closeOnEscape = true;
  @Input() backdropClass = signal<string>('');
  @Input() containerClass = signal<string>('');

  @ViewChild('dialogElement') dialogElement?: ElementRef<HTMLElement>;

  protected readonly _open = signal(false);
  protected readonly titleId = generateId('dialog-title');
  protected readonly contentId = generateId('dialog-content');

  private focusTrap?: FocusTrap;
  private previousActiveElement?: HTMLElement;

  constructor(private focusTrapFactory: FocusTrapFactory) {
    // Handle focus trap when dialog opens/closes
    effect(() => {
      if (this._open()) {
        this.previousActiveElement = document.activeElement as HTMLElement;
        setTimeout(() => this.createFocusTrap(), 0);
      } else {
        this.destroyFocusTrap();
        this.restoreFocus();
      }
    });
  }

  ngAfterViewInit(): void {
    if (this._open()) {
      this.createFocusTrap();
    }
  }

  ngOnDestroy(): void {
    this.destroyFocusTrap();
  }

  protected onBackdropClick(): void {
    if (this.closeOnBackdrop) {
      this.close();
    }
  }

  protected onEscape(): void {
    if (this.closeOnEscape) {
      this.close();
    }
  }

  close(): void {
    this._open.set(false);
    this.openChange.emit(false);
  }

  private createFocusTrap(): void {
    if (this.dialogElement?.nativeElement) {
      this.focusTrap = this.focusTrapFactory.create(
        this.dialogElement.nativeElement
      );
      this.focusTrap.focusInitialElementWhenReady();
    }
  }

  private destroyFocusTrap(): void {
    this.focusTrap?.destroy();
    this.focusTrap = undefined;
  }

  private restoreFocus(): void {
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
      this.previousActiveElement = undefined;
    }
  }
}
