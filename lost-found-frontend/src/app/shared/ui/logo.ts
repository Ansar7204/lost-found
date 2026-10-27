import { Component, input } from '@angular/core';

/** The logo mark: a tiny luggage tag (20x24 by default) with a hole punch. */
@Component({
  selector: 'app-logo',
  template: `<span class="mark" aria-hidden="true"><span class="hole"></span></span>
    @if (withWordmark()) {
      <span class="wordmark">Lost &amp; Found</span>
    }`,
  styles: `
    @use 'mixins' as *;

    :host {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .mark {
      width: var(--w, 20px);
      height: calc(var(--w, 20px) * 1.2);
      background: var(--text);
      @include tag-shape(calc(var(--w, 20px) / 4));
      display: flex;
      justify-content: center;
      padding-top: calc(var(--w, 20px) / 5);
    }
    .hole {
      width: calc(var(--w, 20px) / 4);
      height: calc(var(--w, 20px) / 4);
      border-radius: 50%;
      background: var(--bg);
    }
    .wordmark {
      font-size: 15px;
      font-weight: 800;
      font-variation-settings: 'wdth' 118;
      letter-spacing: -0.01em;
      white-space: nowrap;
    }
  `,
  host: { '[style.--w.px]': 'size()' },
})
export class Logo {
  readonly size = input(20);
  readonly withWordmark = input(false);
}
