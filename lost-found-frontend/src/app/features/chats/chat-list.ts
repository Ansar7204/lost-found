import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ChatStore } from '../../core/state/chat.store';
import { ItemsStore } from '../../core/state/items.store';
import { TimeAgoPipe } from '../../shared/pipes/time.pipes';
import { Avatar } from '../../shared/ui/avatar';

/** All my conversations, newest first. */
@Component({
  selector: 'app-chat-list',
  imports: [RouterLink, Avatar, TimeAgoPipe],
  template: `
    <h1 class="title">Chats</h1>

    <ul class="list">
      @for (row of rows(); track row.id) {
        <li>
          <a class="row" [routerLink]="['/chats', row.id]">
            <app-avatar [initials]="row.other?.initials ?? '?'" tone="amber" [size]="36" />
            <div class="text">
              <p class="name">
                {{ row.other?.name ?? 'Someone' }}
                <span class="mono">· {{ row.itemTitle }} · Nº {{ row.itemNo }}</span>
              </p>
              <p class="last">{{ row.last?.text ?? 'No messages yet' }}</p>
            </div>
            <div class="side">
              <span class="mono">{{ row.last?.at | timeAgo }}</span>
              @if (row.unread) {
                <span class="unread" aria-label="unread"></span>
              }
            </div>
          </a>
        </li>
      } @empty {
        <li class="empty">
          No chats yet. Open an item and tap “This is mine” to message the finder.
        </li>
      }
    </ul>
  `,
  styleUrl: './chat-list.scss',
})
export class ChatList {
  private readonly chat = inject(ChatStore);
  private readonly items = inject(ItemsStore);
  private readonly auth = inject(AuthService);

  /** A "view model": everything the template needs, precomputed. */
  protected readonly rows = computed(() => {
    const me = this.auth.currentUser()?.id;
    return this.chat.threads().map((t) => {
      const otherId = t.participants.find((p) => p !== me);
      return {
        id: t.id,
        itemNo: t.itemNo,
        itemTitle: this.items.byNo(t.itemNo)?.title ?? 'Item',
        other: this.auth.users().find((u) => u.id === otherId),
        last: t.messages.at(-1),
        unread: this.chat.isUnread(t),
      };
    });
  });
}
