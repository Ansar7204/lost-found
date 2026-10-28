import { LowerCasePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, initialsOf } from '../../core/auth/auth.service';
import { User } from '../../core/models/models';
import { AlertsStore } from '../../core/state/alerts.store';
import { ChatStore } from '../../core/state/chat.store';
import { ItemsStore } from '../../core/state/items.store';
import { placeLabel } from '../../core/util/matching';
import { Viewport } from '../../core/util/media';
import { TimeAgoPipe, WhenPipe } from '../../shared/pipes/time.pipes';
import { Avatar } from '../../shared/ui/avatar';
import { ChatThread } from '../../shared/ui/chat-thread';
import { Photo } from '../../shared/ui/photo';

/** Listing detail: D2 on desktop (chat in the right panel), M3 on mobile. */
@Component({
  selector: 'app-item-detail',
  imports: [RouterLink, LowerCasePipe, Photo, Avatar, ChatThread, TimeAgoPipe, WhenPipe],
  templateUrl: './item-detail.html',
  styleUrl: './item-detail.scss',
})
export class ItemDetail {
  private readonly router = inject(Router);
  private readonly itemsStore = inject(ItemsStore);
  private readonly chat = inject(ChatStore);
  private readonly alerts = inject(AlertsStore);
  private readonly viewport = inject(Viewport);
  private readonly auth = inject(AuthService);

  /** From the route /item/:no (withComponentInputBinding). */
  readonly no = input.required<string>();

  protected readonly me = this.auth.currentUser;
  protected readonly item = computed(() => this.itemsStore.byNo(this.no()));
  protected readonly place = computed(() => {
    const item = this.item();
    return item ? placeLabel(item) : '';
  });

  /** 'loading' until the item arrives from the API, 'missing' if it doesn't exist. */
  protected readonly loadState = signal<'loading' | 'ready' | 'missing' | 'error'>('loading');

  /** The finder: name from the API; returned count from the local directory if we have it. */
  protected readonly finder = computed<User | undefined>(() => {
    const item = this.item();
    if (!item) return undefined;
    const known = this.auth.users().find((u) => u.id === item.finderId);
    const name = item.finderName ?? known?.name ?? 'Finder';
    return {
      id: item.finderId,
      name,
      email: known?.email ?? '',
      initials: known?.initials ?? initialsOf(name),
      returnedCount: known?.returnedCount ?? 0,
    };
  });
  protected readonly isFinder = computed(() => this.item()?.finderId === this.me()?.id);
  protected readonly isOpen = computed(() => this.item()?.status === 'open');

  /**
   * Which conversation to show. Someone who lost it: their own thread with the
   * finder. The finder: the latest thread about this item.
   */
  protected readonly thread = computed(() => {
    const no = this.no();
    return this.isFinder()
      ? this.chat.threads().find((t) => t.itemNo === no)
      : this.chat.forItem(no);
  });

  protected readonly otherPerson = computed(() => {
    if (!this.isFinder()) return this.finder();
    const otherId = this.thread()?.participants.find((p) => p !== this.me()?.id);
    return this.auth.users().find((u) => u.id === otherId);
  });

  protected readonly photoIndex = signal(0);
  protected readonly photoCount = computed(() => Math.max(1, this.item()?.photos.length ?? 0));

  constructor() {
    // Load the item by its number (deep link, refresh, or not in the Browse list).
    effect(() => {
      const no = this.no();
      untracked(() => {
        this.loadState.set('loading');
        this.itemsStore
          .load(no)
          .then((item) => this.loadState.set(item ? 'ready' : 'missing'))
          .catch(() => this.loadState.set('error'));
      });
    });

    // Opening the page counts as reading the chat (only where it's visible).
    effect(() => {
      const thread = this.thread();
      if (thread && this.viewport.isDesktop()) {
        untracked(() => this.chat.markRead(thread.id));
      }
    });

    // Arriving from a notification: clear its unread dot.
    effect(() => {
      const link = `/item/${this.no()}`;
      untracked(() =>
        this.alerts
          .notifications()
          .filter((n) => !n.read && n.link === link)
          .forEach((n) => this.alerts.markRead(n)),
      );
    });
  }

  protected send(text: string): void {
    const item = this.item();
    if (!item) return;
    this.rememberFinder();
    const thread = this.thread() ?? this.chat.openOrCreate(item.no, item.finderId);
    this.chat.send(thread.id, text);
  }

  /** Mobile CTA: "This is mine · Message finder". */
  protected messageFinder(): void {
    const item = this.item();
    if (!item) return;
    this.rememberFinder();
    const thread = this.chat.openOrCreate(item.no, item.finderId);
    this.router.navigate(['/chats', thread.id]);
  }

  /** So the (local) chat list can show the finder's name. */
  private rememberFinder(): void {
    const finder = this.finder();
    if (finder && !this.isFinder()) this.auth.remember(finder);
  }

  protected async markReturned(): Promise<void> {
    const item = this.item();
    if (!item) return;
    const who = this.otherPerson()?.name ?? 'its owner';
    if (!confirm(`Mark “${item.title}” as returned to ${who}?`)) return;
    try {
      await this.itemsStore.markReturned(item.no);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not mark it as returned.');
    }
  }

  protected back(): void {
    if (history.length > 1) history.back();
    else this.router.navigate(['/']);
  }
}
