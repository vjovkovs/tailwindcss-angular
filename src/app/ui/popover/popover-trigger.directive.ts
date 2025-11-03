import { Directive, HostBinding } from '@angular/core';

/**
 * Directive for popover trigger
 */
@Directive({
  selector: '[popover-trigger]',
  standalone: true,
})
export class PopoverTriggerDirective {
  @HostBinding('attr.aria-haspopup') ariaHasPopup = 'dialog';
}
