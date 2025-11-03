import { Directive, HostBinding } from '@angular/core';

/**
 * Directive for dialog actions
 * Adds appropriate styling for action buttons
 */
@Directive({
  selector: '[dialog-actions]',
  standalone: true,
})
export class DialogActionsDirective {
  @HostBinding('class') class = 'dialog-actions';
  @HostBinding('style.display') display = 'flex';
  @HostBinding('style.gap') gap = '0.75rem';
  @HostBinding('style.justifyContent') justifyContent = 'flex-end';
  @HostBinding('style.padding') padding = '1rem';
  @HostBinding('style.borderTop') borderTop = '1px solid #e5e7eb';
}
