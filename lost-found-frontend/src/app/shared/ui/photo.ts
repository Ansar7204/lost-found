import { Component, input } from '@angular/core';

/** An item photo, or the striped placeholder with a mono caption when there is none. */
@Component({
  selector: 'app-photo',
  template: `
    @if (src(); as src) {
      <img [src]="src" [alt]="alt()" />
    } @else {
      <span class="caption">{{ caption() }}</span>
    }
  `,
  styles: `
    @use 'mixins' as *;

    :host {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: 3px;
      @include striped-placeholder;
    }
    img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .caption {
      @include mono(11px);
      padding: 0 8px;
      text-align: center;
    }
  `,
})
export class Photo {
  readonly src = input<string | undefined>();
  readonly caption = input<string | undefined>('');
  readonly alt = input('');
}
