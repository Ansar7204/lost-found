import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiError } from '../api/api-error.interceptor';
import { ApiMeResponse } from '../api/api.types';
import { DbStore } from '../data/db.store';
import { User } from '../models/models';
import { MsalClient } from './msal-client';

export const UNIVERSITY_DOMAIN = '@kbtu.kz';
const DEV_SESSION_KEY = 'lf.devUser';

/** Header the API reads in Development (Auth:Mode = "Dev"). */
export const DEV_USER_HEADER = 'X-Dev-User';

/**
 * US-01: sign in with the KBTU account.
 *
 * Who the user is always comes from the API (GET /api/me), so the frontend and
 * the backend agree on the user id that owns posts, chats and saved searches.
 *
 * Two modes (environment.auth.mode):
 *  - 'msal': Microsoft Entra ID via MSAL; the auth interceptor adds the Bearer token.
 *  - 'dev':  any @kbtu.kz email, sent as the X-Dev-User header. Kept in sessionStorage
 *            (per tab), so two tabs can be two different students.
 *
 * Public surface (currentUser, isSignedIn, users, signOut) is what components use.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly dbStore = inject(DbStore);

  readonly mode = environment.auth.mode;
  private readonly msal = this.mode === 'msal' ? new MsalClient(environment.auth.msal) : null;

  private readonly user = signal<User | null>(null);
  private devEmail: string | null = readDevSession();

  readonly currentUser = this.user.asReadonly();
  readonly isSignedIn = computed(() => this.user() !== null);

  /** Why the last sign-in failed (shown on the sign-in page). */
  readonly error = signal('');

  /**
   * Everyone we know a name for: the signed-in user plus people met in chats.
   * Chats and alerts still run locally until their APIs exist (Sprints 2–3).
   */
  readonly users = computed(() => this.dbStore.db().users);

  /** Runs once before the first navigation (provideAppInitializer in app.config.ts). */
  async init(): Promise<void> {
    try {
      if (this.msal) {
        const { account, returnTo } = await this.msal.init();
        if (!account) return;
        await this.loadMe();
        // Back from Microsoft: continue to the page the user asked for (authGuard's ?next=).
        if (returnTo?.startsWith('/')) history.replaceState(history.state, '', returnTo);
      } else if (this.devEmail) {
        await this.loadMe();
      }
    } catch (error) {
      this.forget();
      this.error.set(describe(error));
    }
  }

  isUniversityEmail(email: string): boolean {
    const value = email.trim().toLowerCase();
    return value.endsWith(UNIVERSITY_DOMAIN) && value.length > UNIVERSITY_DOMAIN.length;
  }

  /** Microsoft sign-in: leaves the app and comes back to `returnTo`. */
  async signInWithMicrosoft(returnTo = '/', loginHint?: string): Promise<void> {
    if (!this.msal) throw new Error('Microsoft sign-in is off in this build');
    this.error.set('');
    await this.msal.signIn(returnTo, loginHint);
  }

  /** Dev sign-in: any @kbtu.kz address. Resolves to null (and sets `error`) on failure. */
  async signInDev(email: string): Promise<User | null> {
    const value = email.trim().toLowerCase();
    this.error.set('');
    if (!this.isUniversityEmail(value)) {
      this.error.set(`Use your ${UNIVERSITY_DOMAIN} email.`);
      return null;
    }
    this.devEmail = value;
    try {
      const user = await this.loadMe();
      writeDevSession(value);
      return user;
    } catch (error) {
      this.forget();
      this.error.set(describe(error));
      return null;
    }
  }

  async signOut(): Promise<void> {
    this.forget();
    if (this.msal) await this.msal.signOut();
  }

  /** Headers for an API request. Used by authInterceptor. */
  async authHeaders(): Promise<Record<string, string>> {
    if (this.msal) {
      return { Authorization: `Bearer ${await this.msal.accessToken()}` };
    }
    return this.devEmail ? { [DEV_USER_HEADER]: this.devEmail } : {};
  }

  /** The API said 401: the session is gone. */
  handleUnauthorized(): void {
    this.forget();
    this.error.set('Your session has expired. Please sign in again.');
  }

  private async loadMe(): Promise<User> {
    const me = await firstValueFrom(this.http.get<ApiMeResponse>(`${environment.apiBaseUrl}/me`));
    const user = userFromMe(me);
    this.user.set(user);
    this.remember(user);
    return user;
  }

  /** Keep a person's name in the local directory, so chats can show who is who. */
  remember(user: User): void {
    this.dbStore.update((db) => {
      const existing = db.users.find((u) => u.id === user.id);
      const merged: User = {
        ...user,
        email: user.email || existing?.email || '',
        returnedCount: existing?.returnedCount ?? user.returnedCount,
      };
      return {
        ...db,
        users: existing
          ? db.users.map((u) => (u.id === user.id ? merged : u))
          : [...db.users, merged],
      };
    });
  }

  private forget(): void {
    this.user.set(null);
    this.devEmail = null;
    writeDevSession(null);
  }
}

export function userFromMe(me: ApiMeResponse): User {
  const name = me.name?.trim() || nameFromEmail(me.email);
  return {
    id: me.userId,
    name,
    email: me.email,
    initials: initialsOf(name),
    returnedCount: 0,
  };
}

/** "a_seitkali@kbtu.kz" -> "Seitkali A." (same rule as the API). */
export function nameFromEmail(email: string): string {
  const local = email.split('@')[0];
  const parts = local.split(/[._-]+/).filter(Boolean);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return parts.length > 1 ? `${cap(parts[1])} ${parts[0].charAt(0).toUpperCase()}.` : cap(local);
}

/** "Aruzhan Seitkali" -> "AS", "Seitkali A." -> "SA" */
export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('') || '?'
  );
}

function describe(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return `Only ${UNIVERSITY_DOMAIN} accounts can use Lost & Found.`;
    if (error.status === 401) return 'Sign-in failed. Please try again.';
    return error.message;
  }
  return error instanceof Error ? error.message : 'Sign-in failed.';
}

function readDevSession(): string | null {
  try {
    return sessionStorage.getItem(DEV_SESSION_KEY);
  } catch {
    return null;
  }
}

function writeDevSession(email: string | null): void {
  try {
    if (email) sessionStorage.setItem(DEV_SESSION_KEY, email);
    else sessionStorage.removeItem(DEV_SESSION_KEY);
  } catch {
    /* private mode: the session just won't survive a reload */
  }
}
