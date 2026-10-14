import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { DbStore } from '../data/db.store';
import { AppNotification, Category, Db, Item, Place } from '../models/models';
import {
  Matchable,
  matchesFilter,
  newId,
  nextItemNo,
  placeLabel,
  searchToFilter,
} from '../util/matching';

/** What the Post form produces. The store fills in number, finder, status. */
export interface ItemDraft {
  title: string;
  category: Category;
  place: Place;
  placeDetail?: string;
  held: string;
  foundAt: string;
  description: string;
  photos: string[];
}

/**
 * Items feature store: the one place that knows how items are read and changed.
 * Components inject this, never DbStore directly.
 */
@Injectable({ providedIn: 'root' })
export class ItemsStore {
  private readonly dbStore = inject(DbStore);
  private readonly auth = inject(AuthService);

  readonly items = computed(() => this.dbStore.db().items);
  readonly openItems = computed(() => this.items().filter((i) => i.status === 'open'));
  readonly nextNo = computed(() => nextItemNo(this.items()));

  /** Items the current user posted. */
  readonly myPosts = computed(() => {
    const me = this.auth.currentUser()?.id;
    return this.items()
      .filter((i) => i.finderId === me)
      .sort(byNewest);
  });

  /** Items that were returned to the current user. */
  readonly gotBack = computed(() => {
    const me = this.auth.currentUser()?.id;
    return this.items()
      .filter((i) => i.status === 'returned' && i.ownerId === me)
      .sort(byNewest);
  });

  byNo(no: string): Item | undefined {
    return this.items().find((i) => i.no === no);
  }

  /** How many other people's saved searches this draft would notify. */
  countMatchingSearches(draft: Matchable): number {
    const me = this.auth.currentUser()?.id;
    return this.dbStore
      .db()
      .savedSearches.filter(
        (s) => s.on && s.userId !== me && matchesFilter(draft, searchToFilter(s)),
      ).length;
  }

  /**
   * Post a found item, then notify every matching saved search.
   * One `update()` = one atomic change, like a DB transaction on the server.
   */
  post(draft: ItemDraft): Item {
    const me = this.requireUser();
    const item: Item = {
      ...draft,
      no: this.nextNo(),
      finderId: me.id,
      status: 'open',
      photoCaption: draft.title.toLowerCase().slice(0, 24),
    };

    this.dbStore.update((db) => notifyMatches({ ...db, items: [item, ...db.items] }, item));
    return item;
  }

  /** Finder only. Closes the item and tells the owner. */
  markReturned(no: string): void {
    const me = this.requireUser();
    const now = new Date().toISOString();

    this.dbStore.update((db) => {
      const item = db.items.find((i) => i.no === no);
      if (!item || item.finderId !== me.id || item.status === 'returned') return db;

      // The owner is whoever the finder was chatting with about this item.
      const thread = db.threads.find((t) => t.itemNo === no);
      const ownerId = thread?.participants.find((p) => p !== me.id);

      const notifications: AppNotification[] = ownerId
        ? [
            {
              id: newId('n'),
              userId: ownerId,
              title: `${me.name} marked “${item.title}” as returned`,
              sub: `Nº ${item.no}`,
              createdAt: now,
              read: false,
              link: `/item/${item.no}`,
            },
          ]
        : [];

      return {
        ...db,
        items: db.items.map((i) =>
          i.no === no ? { ...i, status: 'returned', ownerId, returnedAt: now } : i,
        ),
        users: db.users.map((u) =>
          u.id === me.id ? { ...u, returnedCount: u.returnedCount + 1 } : u,
        ),
        threads: db.threads.map((t) =>
          t.itemNo === no
            ? {
                ...t,
                messages: [
                  ...t.messages,
                  {
                    from: me.id,
                    text: `${me.name} marked this item as returned`,
                    at: now,
                    system: true,
                  },
                ],
              }
            : t,
        ),
        notifications: [...notifications, ...db.notifications],
      };
    });
  }

  private requireUser() {
    const user = this.auth.currentUser();
    if (!user) throw new Error('Not signed in');
    return user;
  }
}

function byNewest(a: Item, b: Item): number {
  return b.foundAt.localeCompare(a.foundAt);
}

/** For each saved search (of someone else) that matches, bump its counter and notify. */
function notifyMatches(db: Db, item: Item): Db {
  const matches = db.savedSearches.filter(
    (s) => s.on && s.userId !== item.finderId && matchesFilter(item, searchToFilter(s)),
  );
  if (matches.length === 0) return db;

  const matchedIds = new Set(matches.map((s) => s.id));
  const now = new Date().toISOString();

  return {
    ...db,
    savedSearches: db.savedSearches.map((s) =>
      matchedIds.has(s.id) ? { ...s, newMatches: s.newMatches + 1 } : s,
    ),
    notifications: [
      ...matches.map<AppNotification>((s) => ({
        id: newId('n'),
        userId: s.userId,
        title: `New match for “${s.name}”: ${item.title}`,
        sub: placeLabel(item),
        createdAt: now,
        read: false,
        link: `/item/${item.no}`,
      })),
      ...db.notifications,
    ],
  };
}
