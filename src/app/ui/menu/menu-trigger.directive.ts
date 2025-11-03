import { Directive, HostBinding } from '@angular/core';

/**
 * Directive for menu trigger button
 */
@Directive({
  selector: '[menu-trigger]',
  standalone: true,
})
export class MenuTriggerDirective {
  @HostBinding('attr.aria-haspopup') ariaHasPopup = 'menu';
  @HostBinding('attr.aria-expanded') ariaExpanded = false;
}
