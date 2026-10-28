import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { DbStore } from '../../core/data/db.store';
import { Item } from '../../core/models/models';
import { ChatStore } from '../../core/state/chat.store';
import { ItemsStore } from '../../core/state/items.store';
import { TimeAgoPipe } from '../../shared/pipes/time.pipes';
import { Avatar } from '../../shared/ui/avatar';
import { Photo } from '../../shared/ui/photo';

type Tab = 'posted' | 'gotBack';

/** "My posts" on desktop, Profile (M7) on mobile. Settings: sign out (+ demo controls in dev). */
@Component({
  selector: 'app-profile',
  imports: [RouterLink, Avatar, Photo, TimeAgoPipe],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private readonly router = inject(Router);
  private readonly dbStore = inject(DbStore);
  private readonly chat = inject(ChatStore);
  protected readonly auth = inject(AuthService);
  protected readonly items = inject(ItemsStore);

  protected readonly tab = signal<Tab>('posted');
  protected readonly settingsOpen = signal(false);

  protected readonly list = computed(() =>
    this.tab() === 'posted' ? this.items.myPosts() : this.items.gotBack(),
  );

  /** "2 people messaged" / "Returned in 3 hours" */
  protected subtitle(item: Item): string {
    if (item.status === 'returned' && item.returnedAt) {
      return `Returned in ${duration(item.foundAt, item.returnedAt)}`;
    }
    const people = this.chat.threads().filter((t) => t.itemNo === item.no).length;
    if (people === 0) return 'No messages yet';
    return `${people} ${people === 1 ? 'person' : 'people'} messaged`;
  }

  /** Dev mode only: sign in as another demo student. */
  protected readonly demoLogins = ['a_seitkali@kbtu.kz', 'd_kassym@kbtu.kz'];

  protected async switchUser(email: string): Promise<void> {
    if (await this.auth.signInDev(email)) {
      this.items.refresh();
      this.settingsOpen.set(false);
    }
  }

  protected resetDemo(): void {
    if (
      confirm('Clear local chats and alerts in this browser? Items on the server are not affected.')
    ) {
      this.dbStore.reset();
      // Keep the signed-in user's name in the fresh local directory.
      window.location.reload();
    }
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate(['/signin']);
  }
}

function duration(fromIso: string, toIso: string): string {
  const hours = Math.max(1, Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 3_600_000));
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'}`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}
