import { Item, ItemFilter, SavedSearch, TimeRange } from '../models/models';

// Pure functions: no Angular, no state. Easy to read, easy to unit test.
// Browse filtering and saved-search notifications share the same rule.

/** The fields matching looks at, so a half-filled Post form can be checked too. */
export type Matchable = Pick<Item, 'title' | 'description' | 'category' | 'place'>;

export function matchesFilter(item: Matchable, filter: ItemFilter): boolean {
  if (filter.category !== 'All' && item.category !== filter.category) return false;
  if (filter.places.length > 0 && !filter.places.includes(item.place)) return false;

  const query = filter.query?.trim().toLowerCase();
  if (query) {
    const haystack = `${item.title} ${item.description}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  return true;
}

const RANGE_MS: Record<TimeRange, number> = {
  today: 86_400_000,
  week: 7 * 86_400_000,
  month: 30 * 86_400_000,
};

export function withinRange(item: Item, range: TimeRange, now = Date.now()): boolean {
  return now - new Date(item.foundAt).getTime() <= RANGE_MS[range];
}

/** Two filters are the same search (order of places doesn't matter). */
export function sameFilter(a: ItemFilter, b: ItemFilter): boolean {
  const norm = (f: ItemFilter) =>
    JSON.stringify([f.category, [...f.places].sort(), f.query?.trim().toLowerCase() ?? '']);
  return norm(a) === norm(b);
}

export function searchToFilter(search: SavedSearch): ItemFilter {
  return { category: search.category, places: search.places, query: search.query };
}

/** Default name for a saved search: the query, else the category. */
export function defaultSearchName(filter: ItemFilter): string {
  const query = filter.query?.trim();
  if (query) return query.charAt(0).toUpperCase() + query.slice(1);
  if (filter.category !== 'All') return filter.category;
  if (filter.places.length) return `Anything in ${filter.places.join(', ')}`;
  return 'Anything on campus';
}

/** "Library · 2nd floor" */
export function placeLabel(item: Pick<Item, 'place' | 'placeDetail'>): string {
  return item.placeDetail ? `${item.place} · ${item.placeDetail}` : item.place;
}

/** Next Nº: highest existing number + 1, zero-padded to 4 digits. */
export function nextItemNo(items: Item[]): string {
  const max = items.reduce((m, i) => Math.max(m, Number(i.no) || 0), 0);
  return String(max + 1).padStart(4, '0');
}

export function newId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
