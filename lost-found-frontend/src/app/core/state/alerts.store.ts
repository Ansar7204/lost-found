import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { DbStore } from '../data/db.store';
import { AppNotification, ItemFilter, NotifyChannel, SavedSearch } from '../models/models';
import { defaultSearchName, newId, sameFilter, searchToFilter } from '../util/matching';

/** Saved searches and notifications of the signed-in user. */
@Injectable({ providedIn: 'root' })
export class AlertsStore {
  private readonly dbStore = inject(DbStore);
  private readonly auth = inject(AuthService);
  private readonly me = computed(() => this.auth.currentUser()?.id);

  readonly searches = computed(() =>
    this.dbStore.db().savedSearches.filter((s) => s.userId === this.me()),
  );

  readonly notifications = computed(() =>
    this.dbStore
      .db()
      .notifications.filter((n) => n.userId === this.me())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );

  readonly unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  findSaved(filter: ItemFilter): SavedSearch | undefined {
    return this.searches().find((s) => sameFilter(searchToFilter(s), filter));
  }

  /** "Save search & notify me" button: save it, or remove it if it's already saved. */
  toggleSaved(filter: ItemFilter, channel: NotifyChannel = 'PUSH'): void {
    const existing = this.findSaved(filter);
    if (existing) {
      this.remove(existing.id);
      return;
    }
    const me = this.me();
    if (!me) return;

    const search: SavedSearch = {
      id: newId('s'),
      userId: me,
      name: defaultSearchName(filter),
      category: filter.category,
      places: [...filter.places],
      query: filter.query?.trim() || undefined,
      channel,
      on: true,
      newMatches: 0,
    };
    this.dbStore.update((db) => ({ ...db, savedSearches: [...db.savedSearches, search] }));
  }

  setOn(id: string, on: boolean): void {
    this.patchSearch(id, { on });
  }

  setChannel(id: string, channel: NotifyChannel): void {
    this.patchSearch(id, { channel });
  }

  remove(id: string): void {
    this.dbStore.update((db) => ({
      ...db,
      savedSearches: db.savedSearches.filter((s) => s.id !== id),
    }));
  }

  /** Opened the search: its "N new" counter is seen. */
  clearMatches(id: string): void {
    this.patchSearch(id, { newMatches: 0 });
  }

  markRead(notification: AppNotification): void {
    this.patchNotifications((n) => (n.id === notification.id ? { ...n, read: true } : n));
  }

  markAllRead(): void {
    const me = this.me();
    this.patchNotifications((n) => (n.userId === me ? { ...n, read: true } : n));
  }

  private patchSearch(id: string, patch: Partial<SavedSearch>): void {
    this.dbStore.update((db) => ({
      ...db,
      savedSearches: db.savedSearches.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }

  private patchNotifications(fn: (n: AppNotification) => AppNotification): void {
    this.dbStore.update((db) => ({ ...db, notifications: db.notifications.map(fn) }));
  }
}
