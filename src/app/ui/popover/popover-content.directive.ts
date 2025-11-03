import { Directive, HostBinding } from '@angular/core';

/**
 * Directive for popover content
 */
@Directive({
  selector: '[popover-content]',
  standalone: true,
})
export class PopoverContentDirective {
  @HostBinding('style.padding') padding = '1rem';
}
