import { Directive, HostBinding } from '@angular/core';

/**
 * Directive for dialog title
 * Adds appropriate styling and semantics
 */
@Directive({
  selector: '[dialog-title]',
  standalone: true,
})
export class DialogTitleDirective {
  @HostBinding('class') class = 'dialog-title';
  @HostBinding('style.fontSize') fontSize = '1.25rem';
  @HostBinding('style.fontWeight') fontWeight = '600';
  @HostBinding('style.marginBottom') marginBottom = '1rem';
}
