import { Directive, HostBinding } from '@angular/core';

/**
 * Directive for dialog content
 * Adds appropriate styling
 */
@Directive({
  selector: '[dialog-content]',
  standalone: true,
})
export class DialogContentDirective {
  @HostBinding('class') class = 'dialog-content';
  @HostBinding('style.padding') padding = '1rem';
  @HostBinding('style.color') color = '#374151';
}
