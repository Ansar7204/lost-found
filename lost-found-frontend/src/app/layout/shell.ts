import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { AlertsStore } from '../core/state/alerts.store';
import { ChatStore } from '../core/state/chat.store';
import { Avatar } from '../shared/ui/avatar';
import { Logo } from '../shared/ui/logo';

/**
 * App frame for signed-in pages: top bar on desktop, bottom tab bar on
 * mobile, and a <router-outlet> where the current page renders.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logo, Avatar],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  host: { '[class.fullscreen]': 'fullscreenOnMobile()' },
})
export class Shell {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly unreadChats = inject(ChatStore).unreadCount;
  protected readonly unreadAlerts = inject(AlertsStore).unreadCount;

  /** Router events as a signal: re-evaluated after every navigation. */
  private readonly snapshot = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => deepestChild(this.router.routerState.snapshot.root)),
    ),
    { initialValue: deepestChild(this.router.routerState.snapshot.root) },
  );

  /** Detail and chat pages hide the tab bar on mobile (M3, M4). */
  protected readonly fullscreenOnMobile = computed(
    () => this.snapshot().data['fullscreenOnMobile'] === true,
  );

  protected readonly query = computed(() => this.snapshot().queryParamMap.get('q') ?? '');

  /** Typing in the top-bar search filters Browse via the URL (?q=...). */
  protected search(value: string): void {
    this.router.navigate(['/'], {
      queryParams: { q: value.trim() || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}

function deepestChild(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  while (route.firstChild) route = route.firstChild;
  return route;
}
