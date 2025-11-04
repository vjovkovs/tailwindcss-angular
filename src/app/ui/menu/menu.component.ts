import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  TemplateRef,
  ViewChild,
  ElementRef,
  QueryList,
  ContentChildren,
  AfterContentInit,
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
import { MenuItemDirective } from './menu-item.directive';

/**
 * Headless Menu Component
 *
 * Features:
 * - Roving tabindex for keyboard navigation
 * - Arrow Up/Down navigation
 * - Home/End keys
 * - Type-ahead search
 * - ARIA menu pattern
 * - Click outside to close
 *
 * Usage:
 * ```html
 * <app-menu [(open)]="isOpen">
 *   <button menu-trigger>Open Menu</button>
 *   <div menu-items>
 *     <button menu-item (click)="handleAction1()">Action 1</button>
 *     <button menu-item (click)="handleAction2()">Action 2</button>
 *     <button menu-item (click)="handleAction3()">Action 3</button>
 *   </div>
 * </app-menu>
 * ```
 */
@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, OverlayModule],
  template: `
    <div #triggerElement (click)="toggle()" (keydown)="onTriggerKeydown($event)">
      <ng-content select="[menu-trigger]" />
    </div>

    <ng-template #menuContent>
      <div
        class="menu-content"
        [class]="contentClass()"
        role="menu"
        [attr.aria-orientation]="'vertical'"
        (keydown)="onMenuKeydown($event)"
      >
        <ng-content select="[menu-items]" />
      </div>
    </ng-template>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .menu-content {
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      border: 1px solid #e5e7eb;
      padding: 0.5rem;
      min-width: 12rem;
    }
  `],
})
export class MenuComponent implements AfterContentInit {
  @Input() set open(value: boolean) {
    this._open.set(value);
    if (value) {
      this.show();
    } else {
      this.close();
    }
  }
  get open(): boolean {
    return this._open();
  }

  @Output() openChange = new EventEmitter<boolean>();
  @Input() contentClass = signal<string>('');
  @Input() position: 'top' | 'bottom' | 'left' | 'right' = 'bottom';

  @ViewChild('triggerElement', { read: ElementRef }) triggerElement!: ElementRef;
  @ViewChild('menuContent') menuContent!: TemplateRef<any>;
  @ContentChildren(MenuItemDirective, { descendants: true })
  menuItems!: QueryList<MenuItemDirective>;

  protected readonly _open = signal(false);

  private overlayRef?: OverlayRef;
  private focusedIndex = -1;
  private typeaheadBuffer = '';
  private typeaheadTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef
  ) {}

  ngAfterContentInit(): void {
    // Initialize menu items
    this.menuItems.forEach((item, index) => {
      item.setIndex(index);
    });
  }

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
      setTimeout(() => this.focusFirstItem(), 0);
    }
  }

  close(): void {
    if (this._open()) {
      this._open.set(false);
      this.openChange.emit(false);
      this.destroyOverlay();
      this.focusedIndex = -1;
    }
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.show();
    }
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    const items = this.menuItems.toArray();

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.close();
        this.triggerElement.nativeElement.querySelector('button')?.focus();
        break;

      case 'ArrowDown':
        event.preventDefault();
        this.focusNextItem();
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.focusPreviousItem();
        break;

      case 'Home':
        event.preventDefault();
        this.focusFirstItem();
        break;

      case 'End':
        event.preventDefault();
        this.focusLastItem();
        break;

      default:
        // Type-ahead functionality
        if (event.key.length === 1 && /[a-zA-Z0-9]/.test(event.key)) {
          this.handleTypeahead(event.key);
        }
        break;
    }
  }

  private focusItem(index: number): void {
    const items = this.menuItems.toArray();
    if (index >= 0 && index < items.length) {
      this.focusedIndex = index;
      items[index].focus();
    }
  }

  private focusFirstItem(): void {
    this.focusItem(0);
  }

  private focusLastItem(): void {
    const items = this.menuItems.toArray();
    this.focusItem(items.length - 1);
  }

  private focusNextItem(): void {
    const items = this.menuItems.toArray();
    const nextIndex = (this.focusedIndex + 1) % items.length;
    this.focusItem(nextIndex);
  }

  private focusPreviousItem(): void {
    const items = this.menuItems.toArray();
    const prevIndex = this.focusedIndex <= 0 ? items.length - 1 : this.focusedIndex - 1;
    this.focusItem(prevIndex);
  }

  private handleTypeahead(key: string): void {
    const items = this.menuItems.toArray();

    // Clear previous timeout
    if (this.typeaheadTimeout) {
      clearTimeout(this.typeaheadTimeout);
    }

    // Add key to buffer
    this.typeaheadBuffer += key.toLowerCase();

    // Find matching item
    const matchIndex = items.findIndex((item) =>
      item.getText().toLowerCase().startsWith(this.typeaheadBuffer)
    );

    if (matchIndex !== -1) {
      this.focusItem(matchIndex);
    }

    // Clear buffer after 500ms
    this.typeaheadTimeout = setTimeout(() => {
      this.typeaheadBuffer = '';
    }, 500);
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
        hasBackdrop: true,
        backdropClass: 'cdk-overlay-transparent-backdrop',
      });

      const portal = new TemplatePortal(this.menuContent, this.viewContainerRef);
      this.overlayRef.attach(portal);

      this.overlayRef.backdropClick().subscribe(() => this.close());
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
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom',
        offsetY: -8,
      },
      bottom: {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
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
