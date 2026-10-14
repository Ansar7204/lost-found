import { Component, input } from '@angular/core';

/** Round avatar with initials. Green = you, amber = someone else (finder). */
@Component({
  selector: 'app-avatar',
  template: `{{ initials() }}`,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: var(--size);
      height: var(--size);
      border-radius: 50%;
      background: var(--status-returned);
      color: var(--text-on-light);
      font-size: calc(var(--size) * 0.4);
      font-weight: 800;
      line-height: 1;
    }
    :host(.amber) {
      background: var(--status-new);
    }
  `,
  host: {
    '[style.--size.px]': 'size()',
    '[class.amber]': "tone() === 'amber'",
    '[attr.aria-hidden]': 'true',
  },
})
export class Avatar {
  readonly initials = input.required<string>();
  readonly size = input(28);
  readonly tone = input<'green' | 'amber'>('green');
}
