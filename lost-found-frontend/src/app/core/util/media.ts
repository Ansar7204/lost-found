import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/**
 * `true` on desktop layouts (>= 1024px), as a signal.
 * CSS handles most responsive work; use this only when behaviour differs,
 * not just looks (e.g. "mark chat as read" only when the chat is visible).
 */
@Injectable({ providedIn: 'root' })
export class Viewport {
  private readonly query = window.matchMedia('(min-width: 1024px)');
  readonly isDesktop = signal(this.query.matches);

  constructor() {
    const onChange = (e: MediaQueryListEvent) => this.isDesktop.set(e.matches);
    this.query.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => this.query.removeEventListener('change', onChange));
  }
}
