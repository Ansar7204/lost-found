import { DestroyRef, Injectable, computed, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { DbStore } from '../data/db.store';
import { ChatMessage, Thread } from '../models/models';
import { newId } from '../util/matching';

const AUTO_REPLY_DELAY_MS = 1500;
const AUTO_REPLIES = [
  'Hi! Can you describe something only the owner would know?',
  "Sounds right. When can you pick it up? I'm on campus until 17:00.",
];

/** Chat threads between a finder and people who think the item is theirs. */
@Injectable({ providedIn: 'root' })
export class ChatStore {
  private readonly dbStore = inject(DbStore);
  private readonly auth = inject(AuthService);
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timers.forEach(clearTimeout));
  }

  /** My threads, most recent activity first. */
  readonly threads = computed(() => {
    const me = this.auth.currentUser()?.id;
    if (!me) return [];
    return this.dbStore
      .db()
      .threads.filter((t) => t.participants.includes(me))
      .sort((a, b) => lastActivity(b).localeCompare(lastActivity(a)));
  });

  readonly unreadCount = computed(() => {
    const me = this.auth.currentUser()?.id;
    return me ? this.threads().filter((t) => isUnread(t, me)).length : 0;
  });

  byId(id: string): Thread | undefined {
    return this.dbStore.db().threads.find((t) => t.id === id);
  }

  /** The current user's conversation about an item, if one exists. */
  forItem(itemNo: string): Thread | undefined {
    const me = this.auth.currentUser()?.id;
    return this.threads().find((t) => t.itemNo === itemNo && !!me && t.participants.includes(me));
  }

  isUnread(thread: Thread): boolean {
    const me = this.auth.currentUser()?.id;
    return !!me && isUnread(thread, me);
  }

  /** "This is mine · Message finder": reuse the thread or start one. */
  openOrCreate(itemNo: string, finderId: string): Thread {
    const me = this.auth.currentUser();
    if (!me) throw new Error('Not signed in');

    const existing = this.forItem(itemNo);
    if (existing) return existing;

    const thread: Thread = {
      id: newId('t'),
      itemNo,
      participants: [me.id, finderId],
      messages: [],
      lastReadAt: { [me.id]: new Date().toISOString() },
    };
    this.dbStore.update((db) => ({ ...db, threads: [...db.threads, thread] }));
    return thread;
  }

  send(threadId: string, text: string): void {
    const me = this.auth.currentUser();
    const body = text.trim();
    if (!me || !body) return;

    const now = new Date().toISOString();
    const isFirstMessage = !this.byId(threadId)?.messages.some((m) => m.from !== me.id);

    this.dbStore.update((db) => ({
      ...db,
      threads: db.threads.map((t) =>
        t.id === threadId
          ? {
              ...t,
              messages: [...t.messages, { from: me.id, text: body, at: now }],
              lastReadAt: { ...t.lastReadAt, [me.id]: now },
            }
          : t,
      ),
    }));

    // Demo only: the other side answers once, so the chat feels alive.
    if (isFirstMessage) this.scheduleAutoReply(threadId, me.id);
  }

  markRead(threadId: string): void {
    const me = this.auth.currentUser()?.id;
    const thread = this.byId(threadId);
    if (!me || !thread || !isUnread(thread, me)) return;

    const now = new Date().toISOString();
    this.dbStore.update((db) => ({
      ...db,
      threads: db.threads.map((t) =>
        t.id === threadId ? { ...t, lastReadAt: { ...t.lastReadAt, [me]: now } } : t,
      ),
    }));
  }

  private scheduleAutoReply(threadId: string, senderId: string): void {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      const thread = this.byId(threadId);
      const other = thread?.participants.find((p) => p !== senderId);
      if (!thread || !other) return;

      const replyCount = thread.messages.filter((m) => m.from === other).length;
      const message: ChatMessage = {
        from: other,
        text: AUTO_REPLIES[Math.min(replyCount, AUTO_REPLIES.length - 1)],
        at: new Date().toISOString(),
      };
      this.dbStore.update((db) => ({
        ...db,
        threads: db.threads.map((t) =>
          t.id === threadId ? { ...t, messages: [...t.messages, message] } : t,
        ),
      }));
    }, AUTO_REPLY_DELAY_MS);
    this.timers.add(timer);
  }
}

function lastActivity(thread: Thread): string {
  return thread.messages.at(-1)?.at ?? '';
}

function isUnread(thread: Thread, userId: string): boolean {
  const lastFromOthers = thread.messages.filter((m) => m.from !== userId && !m.system).at(-1);
  if (!lastFromOthers) return false;
  const readAt = thread.lastReadAt[userId];
  return !readAt || lastFromOthers.at > readAt;
}
