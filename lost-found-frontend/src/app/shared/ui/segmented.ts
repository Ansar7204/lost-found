import { Component, input, model } from '@angular/core';

export interface SegmentOption<T> {
  value: T;
  label: string;
}

/**
 * Segmented control ("Today | This week | This month").
 *
 * `model()` creates a two-way bindable signal, so the parent can write
 * `<app-segmented [(value)]="range" />` — the modern replacement for an
 * @Input() + @Output() valueChange pair.
 */
@Component({
  selector: 'app-segmented',
  template: `
    @for (option of options(); track option.value) {
      <button
        type="button"
        role="radio"
        [attr.aria-checked]="option.value === value()"
        [class.active]="option.value === value()"
        (click)="value.set(option.value)"
      >
        {{ option.label }}
      </button>
    }
  `,
  styles: `
    @use 'mixins' as *;

    :host {
      display: inline-flex;
      gap: 2px;
    }
    :host(.boxed) {
      display: flex;
      padding: 2px;
      border: 1px solid var(--border-input);
      border-radius: var(--radius-control);
      button {
        flex: 1;
      }
    }
    button {
      @include reset-button;
      height: 26px;
      padding: 0 10px;
      border-radius: var(--radius-badge);
      color: var(--text-3);
      white-space: nowrap;
      transition: var(--transition-hover);

      &:hover {
        color: var(--text);
      }
      &.active {
        background: var(--surface-active);
        color: var(--text);
        font-weight: 700;
      }
    }
  `,
  host: { role: 'radiogroup' },
})
export class Segmented<T> {
  readonly options = input.required<readonly SegmentOption<T>[]>();
  readonly value = model.required<T>();
}
