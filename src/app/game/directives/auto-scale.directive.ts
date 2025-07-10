import { Directive, ElementRef, HostListener, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[appAutoScale]',
  exportAs: 'appAutoScale'  // ✅ Asta lipsea
})
export class AutoScaleDirective implements AfterViewInit {
  constructor(private el: ElementRef<HTMLInputElement>) {}

  ngAfterViewInit() {
    // Așteptăm finalizarea DOM-ului
    setTimeout(() => this.resize(), 0);
  }

  @HostListener('input')
  onInput() {
    this.resize();
  }

  resize() {
    const input = this.el.nativeElement;
    const parent = input.parentElement;

    if (!parent) return;

    const button = parent.querySelector('.random-button') as HTMLElement;
    const buttonWidth = button?.offsetWidth || 0;
    const padding = 16; // un mic buffer
    const availableWidth = parent.clientWidth - buttonWidth - padding;

    input.style.fontSize = '1.6rem';

    while (input.scrollWidth > availableWidth && parseFloat(input.style.fontSize) > 1.4) {
      const current = parseFloat(input.style.fontSize);
      input.style.fontSize = (current - 0.1).toFixed(2) + 'rem';
    }
  }
}
