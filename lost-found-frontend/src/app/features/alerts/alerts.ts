import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AppNotification, NotifyChannel, SavedSearch } from '../../core/models/models';
import { AlertsStore } from '../../core/state/alerts.store';
import { TimeAgoPipe } from '../../shared/pipes/time.pipes';
import { SegmentOption, Segmented } from '../../shared/ui/segmented';
import { Toggle } from '../../shared/ui/toggle';

type Tab = 'notifications' | 'searches';

/** Saved searches + notifications (D4 desktop: side by side, M6 mobile: tabs). */
@Component({
  selector: 'app-alerts',
  imports: [RouterLink, Segmented, Toggle, TimeAgoPipe],
  templateUrl: './alerts.html',
  styleUrl: './alerts.scss',
})
export class Alerts {
  private readonly router = inject(Router);
  protected readonly store = inject(AlertsStore);

  protected readonly channels: NotifyChannel[] = ['PUSH', 'EMAIL', 'PUSH + EMAIL'];
  protected readonly tab = signal<Tab>('notifications');

  protected readonly tabs = computed<SegmentOption<Tab>[]>(() => [
    { value: 'notifications', label: 'Notifications' },
    { value: 'searches', label: `Saved searches · ${this.store.searches().length}` },
  ]);

  protected tags(search: SavedSearch): string[] {
    return [
      search.category === 'All' ? 'Any category' : search.category,
      ...(search.places.length ? search.places : ['Anywhere']),
      ...(search.query ? [`“${search.query}”`] : []),
    ];
  }

  protected changeChannel(search: SavedSearch, value: string): void {
    const channel = this.channels.find((c) => c === value);
    if (channel) this.store.setChannel(search.id, channel);
  }

  /** Open the search on Browse, and count its matches as seen. */
  protected openSearch(search: SavedSearch): void {
    this.store.clearMatches(search.id);
    this.router.navigate(['/'], {
      queryParams: {
        cat: search.category === 'All' ? null : search.category,
        places: search.places.length ? search.places.join(',') : null,
        q: search.query || null,
        range: 'month',
      },
    });
  }

  protected openNotification(notification: AppNotification): void {
    this.store.markRead(notification);
    this.router.navigateByUrl(notification.link);
  }
}
