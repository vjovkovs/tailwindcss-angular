import { Directive, ElementRef, HostBinding, HostListener } from '@angular/core';

/**
 * Directive for menu items
 * Handles styling and accessibility
 */
@Directive({
  selector: '[menu-item]',
  standalone: true,
})
export class MenuItemDirective {
  @HostBinding('attr.role') role = 'menuitem';
  @HostBinding('attr.tabindex') tabindex = -1;
  @HostBinding('class') class = 'menu-item';
  @HostBinding('style.display') display = 'block';
  @HostBinding('style.width') width = '100%';
  @HostBinding('style.padding') padding = '0.5rem 0.75rem';
  @HostBinding('style.textAlign') textAlign = 'left';
  @HostBinding('style.border') border = 'none';
  @HostBinding('style.background') background = 'transparent';
  @HostBinding('style.cursor') cursor = 'pointer';
  @HostBinding('style.borderRadius') borderRadius = '0.25rem';
  @HostBinding('style.transition') transition = 'background-color 0.15s';

  private index = -1;

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.elementRef.nativeElement.style.backgroundColor = '#f3f4f6';
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.elementRef.nativeElement.style.backgroundColor = 'transparent';
  }

  setIndex(index: number): void {
    this.index = index;
  }

  focus(): void {
    this.tabindex = 0;
    this.elementRef.nativeElement.focus();
  }

  blur(): void {
    this.tabindex = -1;
  }

  getText(): string {
    return this.elementRef.nativeElement.textContent?.trim() || '';
  }
}
