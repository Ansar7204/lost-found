import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Db } from '../models/models';
import { buildSeed, DB_VERSION } from './seed';
import { StorageService } from './storage.service';

const DB_KEY = 'lf.db';

/**
 * The single source of truth for the demo: the whole Db in one signal,
 * persisted to localStorage.
 *
 * Feature stores (ItemsStore, ChatStore, ...) read slices of it with
 * `computed()` and write through `update()`. Updates are immutable: we
 * always return a new object, never mutate, so signals see the change.
 *
 * When the real backend is ready, this class is what gets replaced by HTTP
 * calls; components talk to the feature stores and won't notice.
 */
@Injectable({ providedIn: 'root' })
export class DbStore {
  private readonly storage = inject(StorageService);
  private readonly state = signal<Db>(this.load());

  /** Read-only view. Only `update()` can change the data. */
  readonly db = this.state.asReadonly();

  constructor() {
    // Another tab changed the data (e.g. you're signed in as a different user
    // there and posted an item). Pull it in so both tabs stay live.
    const onStorage = (event: StorageEvent) => {
      if (event.key === DB_KEY && event.newValue) {
        this.state.set(JSON.parse(event.newValue) as Db);
      }
    };
    window.addEventListener('storage', onStorage);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('storage', onStorage));
  }

  update(change: (db: Db) => Db): void {
    const next = change(this.state());
    this.state.set(next);
    this.storage.write(DB_KEY, next);
  }

  /** Throw away local changes and start over from the seed data. */
  reset(): void {
    this.update(() => buildSeed());
  }

  private load(): Db {
    const saved = this.storage.read<Db>(DB_KEY);
    if (saved?.version === DB_VERSION) return saved;

    const seed = buildSeed();
    this.storage.write(DB_KEY, seed);
    return seed;
  }
}
