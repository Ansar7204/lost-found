import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiFoundItem, ApiFoundItemStatus, ApiItemCategory } from '../app/core/api/api.types';
import { AuthService } from '../app/core/auth/auth.service';

// Helpers for specs that talk to a faked backend (HttpTestingController).

export const ARUZHAN = {
  userId: '11111111-1111-4111-8111-111111111111',
  name: 'Aruzhan Seitkali',
  email: 'a_seitkali@kbtu.kz',
};
export const DANIYAR = {
  userId: '22222222-2222-4222-8222-222222222222',
  name: 'Daniyar Kassym',
  email: 'd_kassym@kbtu.kz',
};

let seq = 0;

/** A backend item with sensible defaults. */
export function apiItem(overrides: Partial<ApiFoundItem> = {}): ApiFoundItem {
  seq += 1;
  return {
    id: `00000000-0000-4000-8000-${String(seq).padStart(12, '0')}`,
    number: 400 + seq,
    userFoundId: DANIYAR.userId,
    finderName: DANIYAR.name,
    name: `Item ${seq}`,
    description: '',
    category: ApiItemCategory.Other,
    cabinet: 'Library',
    heldAt: 'With finder',
    status: ApiFoundItemStatus.Open,
    foundAt: new Date(Date.now() - seq * 60_000).toISOString(),
    createdAt: new Date(Date.now() - seq * 60_000).toISOString(),
    photoUrl: null,
    ...overrides,
  };
}

/** Sign in through the real AuthService (dev mode) and answer GET /api/me. */
export async function signInAs(user: typeof ARUZHAN): Promise<void> {
  const auth = TestBed.inject(AuthService);
  const signedIn = auth.signInDev(user.email);
  (await nextRequest((r) => r.url === '/api/me')).flush(user);
  await signedIn;
}

/** Answer the two list requests ItemsStore makes after sign-in. */
export async function flushLists(open: ApiFoundItem[], mine: ApiFoundItem[] = []): Promise<void> {
  TestBed.tick(); // run the store's "user changed -> reload" effect
  const page = (items: ApiFoundItem[]) => ({
    items,
    totalCount: items.length,
    page: 1,
    pageSize: 100,
  });
  (await nextRequest((r) => r.url === '/api/items' && r.params.get('status') === '0')).flush(
    page(open),
  );
  (await nextRequest((r) => r.url === '/api/items' && r.params.get('mine') === 'true')).flush(
    page(mine),
  );
  await settle();
}

/** Wait until HttpClient has actually sent a request matching `match`. */
export async function nextRequest(
  match: (r: TestRequest['request']) => boolean,
): Promise<TestRequest> {
  const http = TestBed.inject(HttpTestingController);
  for (let i = 0; i < 20; i++) {
    const found = http.match(match);
    if (found.length) return found[0];
    await new Promise((r) => setTimeout(r));
  }
  return http.expectOne(match); // fails with a readable message
}

/** Let pending promises (async store methods) run. */
export const settle = () => new Promise((r) => setTimeout(r));
