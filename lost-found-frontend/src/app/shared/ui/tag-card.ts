import { Component, computed, input } from '@angular/core';
import { Item } from '../../core/models/models';
import { placeLabel } from '../../core/util/matching';
import { TimeAgoPipe } from '../pipes/time.pipes';
import { Photo } from './photo';

const NEW_FOR_MS = 24 * 60 * 60 * 1000;

/**
 * The signature element: every listing is a luggage tag.
 * Presentational ("dumb") component: data in through inputs, no services.
 * The parent decides what happens on click (link, preview, ...).
 */
@Component({
  selector: 'app-tag-card',
  imports: [Photo, TimeAgoPipe],
  template: `
    <span class="hole" aria-hidden="true"></span>
    <div class="photo-wrap">
      <app-photo class="photo" [src]="item().photos[0]" [caption]="item().photoCaption" />
      @if (isNew()) {
        <span class="pill pill--new new">New</span>
      }
    </div>
    <div class="meta">
      <span>Nº {{ item().no }}</span>
      <span>{{ timeLabel() ?? (item().foundAt | timeAgo) }}</span>
    </div>
    <h3 class="title">{{ item().title || 'What is it?' }}</h3>
    <p class="sub">{{ place() }} · {{ item().held }}</p>
  `,
  styleUrl: './tag-card.scss',
})
export class TagCard {
  readonly item = input.required<Item>();
  /** Override the time label (the Post preview says "JUST NOW"). */
  readonly timeLabel = input<string>();

  protected readonly place = computed(() => placeLabel(this.item()));
  protected readonly isNew = computed(
    () =>
      this.item().status === 'open' &&
      Date.now() - new Date(this.item().foundAt).getTime() < NEW_FOR_MS,
  );
}
