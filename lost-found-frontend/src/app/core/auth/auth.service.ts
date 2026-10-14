import { Injectable, computed, inject, signal } from '@angular/core';
import { DbStore } from '../data/db.store';
import { User } from '../models/models';

const SESSION_KEY = 'lf.session';
export const UNIVERSITY_DOMAIN = '@kbtu.kz';

/**
 * Fake auth for the demo: any @kbtu.kz email + any 6 digits.
 *
 * The session is kept in sessionStorage (per browser tab) on purpose: open
 * two tabs, sign in as two different students, and watch notifications and
 * chat move between them live.
 *
 * Later this becomes Microsoft Entra ID sign-in (MSAL), because the backend
 * validates Azure AD tokens. See docs/BACKEND_INTEGRATION.md.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly dbStore = inject(DbStore);
  private readonly userId = signal<string | null>(readSession());

  readonly currentUser = computed<User | null>(() => {
    const id = this.userId();
    return this.dbStore.db().users.find((u) => u.id === id) ?? null;
  });

  readonly isSignedIn = computed(() => this.currentUser() !== null);

  /** Every user, for the demo "switch user" control in Settings. */
  readonly users = computed(() => this.dbStore.db().users);

  isUniversityEmail(email: string): boolean {
    const value = email.trim().toLowerCase();
    return value.endsWith(UNIVERSITY_DOMAIN) && value.length > UNIVERSITY_DOMAIN.length;
  }

  /** Pretend to send a code. Real version: POST /auth/otp. */
  requestCode(email: string): boolean {
    return this.isUniversityEmail(email);
  }

  verifyCode(email: string, code: string): User | null {
    if (!/^\d{6}$/.test(code) || !this.isUniversityEmail(email)) return null;
    const user = this.findOrCreateUser(email.trim().toLowerCase());
    this.setSession(user.id);
    return user;
  }

  switchUser(userId: string): void {
    this.setSession(userId);
  }

  signOut(): void {
    this.setSession(null);
  }

  private findOrCreateUser(email: string): User {
    const existing = this.dbStore.db().users.find((u) => u.email === email);
    if (existing) return existing;

    const user = userFromEmail(email);
    this.dbStore.update((db) => ({ ...db, users: [...db.users, user] }));
    return user;
  }

  private setSession(userId: string | null): void {
    this.userId.set(userId);
    try {
      if (userId) sessionStorage.setItem(SESSION_KEY, userId);
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* private mode: session just won't survive a reload */
    }
  }
}

function readSession(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

/** "a_seitkali@kbtu.kz" -> { name: "A. Seitkali", initials: "AS" } */
export function userFromEmail(email: string): User {
  const local = email.split('@')[0];
  const parts = local.split(/[._-]+/).filter(Boolean);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const name =
    parts.length > 1 ? `${cap(parts[1])} ${parts[0].charAt(0).toUpperCase()}.` : cap(local);
  const initials = parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
  return { id: `u_${local}`, name, email, initials: initials || '?', returnedCount: 0 };
}
