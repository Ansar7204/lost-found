import { Component, input, model } from '@angular/core';

/** On/off switch (28x16). Accessible: a real button with role="switch". */
@Component({
  selector: 'app-toggle',
  template: `
    <button
      type="button"
      role="switch"
      [attr.aria-checked]="checked()"
      [attr.aria-label]="label()"
      (click)="checked.set(!checked())"
    >
      <span class="knob"></span>
    </button>
  `,
  styles: `
    @use 'mixins' as *;

    button {
      @include reset-button;
      position: relative;
      display: block;
      width: 28px;
      height: 16px;
      border-radius: 8px;
      background: var(--border-strong);
      transition: var(--transition-hover);

      &[aria-checked='true'] {
        background: var(--text);
        .knob {
          left: 14px;
        }
      }
    }
    .knob {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--bg);
    }
  `,
})
export class Toggle {
  readonly checked = model(false);
  readonly label = input('Toggle');
}
