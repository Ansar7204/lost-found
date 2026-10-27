import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import {
  CATEGORIES,
  Category,
  CategoryFilter,
  ItemFilter,
  PLACES,
  Place,
  SortOrder,
  TimeRange,
} from '../../core/models/models';
import { AlertsStore } from '../../core/state/alerts.store';
import { ItemsStore } from '../../core/state/items.store';
import { matchesFilter, withinRange } from '../../core/util/matching';
import { SegmentOption, Segmented } from '../../shared/ui/segmented';
import { TagCard } from '../../shared/ui/tag-card';

const RANGES: readonly SegmentOption<TimeRange>[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];
const RANGE_LABEL: Record<TimeRange, string> = {
  today: 'TODAY',
  week: 'THIS WEEK',
  month: 'THIS MONTH',
};

/**
 * Browse (D1 / M2).
 *
 * All filter state lives in the URL: /?cat=Keys&places=Dorms,Library&q=red&range=week
 * So filtered views can be bookmarked, shared, and survive a refresh; Back works.
 * The query params arrive as inputs thanks to withComponentInputBinding().
 */
@Component({
  selector: 'app-browse',
  imports: [RouterLink, RouterOutlet, TagCard, Segmented],
  templateUrl: './browse.html',
  styleUrl: './browse.scss',
})
export class Browse {
  private readonly router = inject(Router);
  private readonly itemsStore = inject(ItemsStore);
  protected readonly alerts = inject(AlertsStore);

  // ---- URL query params (raw strings) ----
  readonly cat = input<string>();
  readonly places = input<string>();
  readonly q = input<string>();
  readonly range = input<string>();
  readonly sort = input<string>();

  protected readonly categories: readonly CategoryFilter[] = ['All', ...CATEGORIES];
  protected readonly allPlaces = PLACES;
  protected readonly ranges = RANGES;

  // ---- Parsed + validated filter state ----
  protected readonly category = computed<CategoryFilter>(() => {
    const value = this.cat();
    return CATEGORIES.includes(value as Category) ? (value as Category) : 'All';
  });

  protected readonly selectedPlaces = computed<Place[]>(() =>
    (this.places() ?? '').split(',').filter((p): p is Place => PLACES.includes(p as Place)),
  );

  protected readonly timeRange = computed<TimeRange>(() =>
    RANGES.some((r) => r.value === this.range()) ? (this.range() as TimeRange) : 'week',
  );

  protected readonly sortOrder = computed<SortOrder>(() =>
    this.sort() === 'oldest' ? 'oldest' : 'newest',
  );

  protected readonly filter = computed<ItemFilter>(() => ({
    category: this.category(),
    places: this.selectedPlaces(),
    query: this.q()?.trim() || undefined,
  }));

  // ---- Derived data ----
  protected readonly visibleItems = computed(() => {
    const filter = this.filter();
    const range = this.timeRange();
    const items = this.itemsStore
      .openItems()
      .filter((i) => withinRange(i, range) && matchesFilter(i, filter));
    const direction = this.sortOrder() === 'newest' ? -1 : 1;
    return items.sort((a, b) => direction * a.foundAt.localeCompare(b.foundAt));
  });

  /** Count per place, ignoring the place filter itself (so counts don't collapse to 0). */
  protected readonly placeCounts = computed(() => {
    const filter = { ...this.filter(), places: [] };
    const range = this.timeRange();
    const counts = new Map<Place, number>();
    for (const item of this.itemsStore.openItems()) {
      if (withinRange(item, range) && matchesFilter(item, filter)) {
        counts.set(item.place, (counts.get(item.place) ?? 0) + 1);
      }
    }
    return counts;
  });

  protected readonly title = computed(() => {
    const places = this.selectedPlaces();
    const category = this.category();
    return [
      category === 'All' ? 'anything' : category,
      places.length ? places.join(', ') : 'all of campus',
    ].join(' · ');
  });

  protected readonly countLabel = computed(() => {
    const n = this.visibleItems().length;
    return `${n} ITEM${n === 1 ? '' : 'S'} · ${RANGE_LABEL[this.timeRange()]}`;
  });

  protected readonly isSaved = computed(() => !!this.alerts.findSaved(this.filter()));

  // ---- Actions: they only change the URL; the inputs above do the rest ----
  protected setCategory(category: CategoryFilter): void {
    this.setParams({ cat: category === 'All' ? null : category });
  }

  protected togglePlace(place: Place): void {
    const current = this.selectedPlaces();
    const next = current.includes(place) ? current.filter((p) => p !== place) : [...current, place];
    this.setParams({ places: next.length ? next.join(',') : null });
  }

  protected setRange(range: TimeRange): void {
    this.setParams({ range: range === 'week' ? null : range });
  }

  protected toggleSort(): void {
    this.setParams({ sort: this.sortOrder() === 'newest' ? 'oldest' : null });
  }

  protected setQuery(q: string): void {
    this.setParams({ q: q.trim() || null }, true);
  }

  protected toggleSaved(): void {
    this.alerts.toggleSaved(this.filter());
  }

  private setParams(params: Record<string, string | null>, replaceUrl = false): void {
    this.router.navigate([], { queryParams: params, queryParamsHandling: 'merge', replaceUrl });
  }
}
