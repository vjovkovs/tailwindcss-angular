# UI Components Guide

This guide covers the headless UI primitives included in the template.

## Dialog

A fully accessible modal dialog component with focus management and keyboard navigation.

### Features
- Escape key to close
- Focus trap (returns focus on close)
- ARIA attributes for screen readers
- Backdrop click to close (optional)
- Full keyboard navigation

### Basic Usage

```typescript
import { Component, signal } from '@angular/core';
import {
  DialogComponent,
  DialogTitleDirective,
  DialogContentDirective,
  DialogActionsDirective,
} from './ui/dialog';

@Component({
  selector: 'app-my-feature',
  standalone: true,
  imports: [
    DialogComponent,
    DialogTitleDirective,
    DialogContentDirective,
    DialogActionsDirective,
  ],
  template: `
    <button (click)="dialogOpen.set(true)">Open Dialog</button>

    <app-dialog [(open)]="dialogOpen" [closeOnBackdrop]="true">
      <div class="p-6">
        <h2 dialog-title>Dialog Title</h2>
        <div dialog-content>
          <p>Dialog content goes here</p>
        </div>
        <div dialog-actions>
          <button (click)="dialogOpen.set(false)">Close</button>
        </div>
      </div>
    </app-dialog>
  `,
})
export class MyFeatureComponent {
  dialogOpen = signal(false);
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Controls dialog visibility (two-way binding) |
| `closeOnBackdrop` | `boolean` | `true` | Close dialog when clicking backdrop |
| `closeOnEscape` | `boolean` | `true` | Close dialog when pressing Escape |
| `backdropClass` | `string` | `''` | Additional CSS classes for backdrop |
| `containerClass` | `string` | `''` | Additional CSS classes for dialog container |

### Directives

- `dialog-title` - Styles for dialog title
- `dialog-content` - Styles for dialog content
- `dialog-actions` - Styles for action buttons

### Accessibility

The dialog component follows the [WAI-ARIA Dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/):

- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby` (linked to title)
- `aria-describedby` (linked to content)
- Focus trap when open
- Focus restoration when closed

---

## Popover

A flexible popover component built with Angular CDK Overlay.

### Features
- CDK Overlay positioning
- Click outside to close
- Escape key to close
- ARIA attributes
- Flexible positioning (top, bottom, left, right)

### Basic Usage

```typescript
import { Component, signal } from '@angular/core';
import {
  PopoverComponent,
  PopoverTriggerDirective,
  PopoverContentDirective,
} from './ui/popover';

@Component({
  selector: 'app-my-feature',
  standalone: true,
  imports: [
    PopoverComponent,
    PopoverTriggerDirective,
    PopoverContentDirective,
  ],
  template: `
    <app-popover [(open)]="popoverOpen" [position]="'bottom'">
      <button popover-trigger>Open Popover</button>
      <div popover-content>
        <p>Popover content</p>
      </div>
    </app-popover>
  `,
})
export class MyFeatureComponent {
  popoverOpen = signal(false);
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Controls popover visibility (two-way binding) |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Popover position relative to trigger |
| `closeOnClickOutside` | `boolean` | `true` | Close when clicking outside |
| `contentClass` | `string` | `''` | Additional CSS classes for content |

### Directives

- `popover-trigger` - Marks the trigger element
- `popover-content` - Marks the content element

---

## Menu

An accessible menu component with full keyboard navigation.

### Features
- Roving tabindex for keyboard navigation
- Arrow Up/Down navigation
- Home/End keys
- Type-ahead search
- ARIA menu pattern
- Click outside to close

### Basic Usage

```typescript
import { Component, signal } from '@angular/core';
import {
  MenuComponent,
  MenuItemDirective,
  MenuTriggerDirective,
} from './ui/menu';

@Component({
  selector: 'app-my-feature',
  standalone: true,
  imports: [
    MenuComponent,
    MenuItemDirective,
    MenuTriggerDirective,
  ],
  template: `
    <app-menu [(open)]="menuOpen" [position]="'bottom'">
      <button menu-trigger>Open Menu</button>
      <div menu-items>
        <button menu-item (click)="handleAction1()">Action 1</button>
        <button menu-item (click)="handleAction2()">Action 2</button>
        <button menu-item (click)="handleAction3()">Action 3</button>
      </div>
    </app-menu>
  `,
})
export class MyFeatureComponent {
  menuOpen = signal(false);

  handleAction1() {
    console.log('Action 1');
    this.menuOpen.set(false);
  }

  handleAction2() {
    console.log('Action 2');
    this.menuOpen.set(false);
  }

  handleAction3() {
    console.log('Action 3');
    this.menuOpen.set(false);
  }
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Controls menu visibility (two-way binding) |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Menu position relative to trigger |
| `contentClass` | `string` | `''` | Additional CSS classes for menu content |

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Space/Enter` | Open menu (when focused on trigger) |
| `ArrowDown` | Move focus to next item |
| `ArrowUp` | Move focus to previous item |
| `Home` | Move focus to first item |
| `End` | Move focus to last item |
| `Escape` | Close menu and return focus to trigger |
| `A-Z` | Type-ahead search (jumps to matching item) |

### Directives

- `menu-trigger` - Marks the trigger button
- `menu-items` - Container for menu items
- `menu-item` - Individual menu item

### Accessibility

The menu component follows the [WAI-ARIA Menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu/):

- `role="menu"` on container
- `role="menuitem"` on items
- `aria-haspopup="menu"` on trigger
- `aria-expanded` on trigger
- Roving tabindex
- Full keyboard navigation

---

## Customization

All components use Tailwind CSS and can be customized by:

1. **Adding custom classes**: Use the `*Class` props
2. **Modifying theme**: Edit `src/styles/tailwind/theme.css`
3. **Extending components**: Create wrapper components with your own defaults

### Example: Custom Styled Dialog

```typescript
@Component({
  selector: 'app-custom-dialog',
  standalone: true,
  imports: [DialogComponent, DialogTitleDirective, DialogContentDirective, DialogActionsDirective],
  template: `
    <app-dialog
      [(open)]="open"
      [containerClass]="'max-w-2xl bg-gray-900 text-white'"
      [backdropClass]="'bg-black/80'"
    >
      <ng-content />
    </app-dialog>
  `,
})
export class CustomDialogComponent {
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();
}
```
