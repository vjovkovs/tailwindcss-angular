import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  TemplateRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Overlay,
  OverlayRef,
  OverlayModule,
  ConnectedPosition,
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ViewContainerRef } from '@angular/core';

/**
 * Headless Popover Component
 *
 * Features:
 * - CDK Overlay positioning
 * - Click outside to close
 * - Escape to close
 * - ARIA attributes
 * - Flexible positioning
 *
 * Usage:
 * ```html
 * <app-popover [(open)]="isOpen" [trigger]="triggerRef">
 *   <ng-template #trigger>
 *     <button>Open Popover</button>
 *   </ng-template>
 *   <ng-template #content>
 *     <div class="p-4">Popover content</div>
 *   </ng-template>
 * </app-popover>
 * ```
 */
@Component({
  selector: 'app-popover',
  standalone: true,
  imports: [CommonModule, OverlayModule],
  template: `
    <div #triggerElement (click)="toggle()">
      <ng-content select="[popover-trigger]" />
    </div>

    <ng-template #popoverContent>
      <div
        class="popover-content"
        [class]="contentClass()"
        role="dialog"
        [attr.aria-modal]="false"
        (keydown.escape)="close()"
      >
        <ng-content select="[popover-content]" />
      </div>
    </ng-template>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .popover-content {
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      border: 1px solid #e5e7eb;
      max-width: 20rem;
    }
  `],
})
export class PopoverComponent {
  @Input() set open(value: boolean) {
    this._open.set(value);
    if (value) {
      this.show();
    } else {
      this.hide();
    }
  }
  get open(): boolean {
    return this._open();
  }

  @Output() openChange = new EventEmitter<boolean>();
  @Input() contentClass = signal<string>('');
  @Input() position: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  @Input() closeOnClickOutside = true;

  @ViewChild('triggerElement', { read: ElementRef }) triggerElement!: ElementRef;
  @ViewChild('popoverContent') popoverContent!: TemplateRef<any>;

  protected readonly _open = signal(false);

  private overlayRef?: OverlayRef;

  constructor(
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef
  ) {}

  toggle(): void {
    if (this._open()) {
      this.close();
    } else {
      this.show();
    }
  }

  show(): void {
    if (!this._open()) {
      this._open.set(true);
      this.openChange.emit(true);
      this.createOverlay();
    }
  }

  close(): void {
    if (this._open()) {
      this._open.set(false);
      this.openChange.emit(false);
      this.destroyOverlay();
    }
  }

  private createOverlay(): void {
    if (!this.overlayRef && this.triggerElement) {
      const positionStrategy = this.overlay
        .position()
        .flexibleConnectedTo(this.triggerElement)
        .withPositions(this.getPositions());

      this.overlayRef = this.overlay.create({
        positionStrategy,
        scrollStrategy: this.overlay.scrollStrategies.reposition(),
        hasBackdrop: this.closeOnClickOutside,
        backdropClass: 'cdk-overlay-transparent-backdrop',
      });

      const portal = new TemplatePortal(
        this.popoverContent,
        this.viewContainerRef
      );
      this.overlayRef.attach(portal);

      if (this.closeOnClickOutside) {
        this.overlayRef.backdropClick().subscribe(() => this.close());
      }
    }
  }

  private destroyOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;
    }
  }

  private getPositions(): ConnectedPosition[] {
    const positions: Record<string, ConnectedPosition> = {
      top: {
        originX: 'center',
        originY: 'top',
        overlayX: 'center',
        overlayY: 'bottom',
        offsetY: -8,
      },
      bottom: {
        originX: 'center',
        originY: 'bottom',
        overlayX: 'center',
        overlayY: 'top',
        offsetY: 8,
      },
      left: {
        originX: 'start',
        originY: 'center',
        overlayX: 'end',
        overlayY: 'center',
        offsetX: -8,
      },
      right: {
        originX: 'end',
        originY: 'center',
        overlayX: 'start',
        overlayY: 'center',
        offsetX: 8,
      },
    };

    return [positions[this.position]];
  }
}
