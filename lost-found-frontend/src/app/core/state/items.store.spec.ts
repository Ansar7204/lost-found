import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  ARUZHAN,
  DANIYAR,
  apiItem,
  flushLists,
  nextRequest,
  settle,
  signInAs,
} from '../../../testing/api-fakes';
import { ApiError, apiErrorInterceptor } from '../api/api-error.interceptor';
import { ApiFoundItemStatus, ApiItemCategory } from '../api/api.types';
import { authInterceptor } from '../auth/auth.interceptor';
import { DbStore } from '../data/db.store';
import { ItemsStore } from './items.store';

// ItemsStore against a faked API (HttpTestingController): what the UI sees after each call.

describe('ItemsStore', () => {
  let items: ItemsStore;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor, authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    items = TestBed.inject(ItemsStore);
    http = TestBed.inject(HttpTestingController);
    await signInAs(DANIYAR);
  });

  afterEach(() => http.verify());

  it('loads open items (Browse) and my posts after sign-in', async () => {
    await flushLists([apiItem({ number: 412, name: 'AirPods case' })], [apiItem({ number: 7 })]);

    expect(items.openItems().map((i) => [i.no, i.title])).toEqual([['0412', 'AirPods case']]);
    expect(items.myPosts().map((i) => i.no)).toEqual(['0007']);
    expect(items.loading()).toBe(false);
  });

  it('shows an error state when the API is down', async () => {
    TestBed.tick();
    (await nextRequest((r) => r.params.get('status') === '0')).error(new ProgressEvent('error'));
    (await nextRequest((r) => r.params.get('mine') === 'true')).flush({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 100,
    });
    await settle();

    expect(items.error()).toBe('Cannot reach the server. Is the API running?');
  });

  // US-02 scenario 1: the item appears at the top of Browse with the next Nº.
  it('posts an item and puts it first in Browse', async () => {
    await flushLists([apiItem({ number: 412 })]);

    const posting = items.post({
      title: ' AirPods Pro case ',
      category: 'Electronics',
      place: 'Library',
      placeDetail: '2nd floor',
      held: 'With finder',
      foundAt: '2026-10-27T06:30:00.000Z',
      description: 'White',
      photos: [],
    });

    const req = await nextRequest((r) => r.method === 'POST' && r.url === '/api/items');
    expect(req.request.headers.get('X-Dev-User')).toBe(DANIYAR.email);
    expect(req.request.body).toEqual({
      name: 'AirPods Pro case',
      description: 'White',
      category: ApiItemCategory.Electronics,
      cabinet: 'Library · 2nd floor',
      heldAt: 'With finder',
      foundAt: '2026-10-27T06:30:00.000Z',
    });
    req.flush(
      apiItem({
        number: 413,
        name: 'AirPods Pro case',
        category: ApiItemCategory.Electronics,
        cabinet: 'Library · 2nd floor',
        userFoundId: DANIYAR.userId,
      }),
      { status: 201, statusText: 'Created' },
    );

    const item = await posting;
    expect(item.no).toBe('0413');
    expect(items.openItems()[0]).toMatchObject({
      no: '0413',
      place: 'Library',
      placeDetail: '2nd floor',
    });
    expect(items.myPosts()[0].no).toBe('0413');
  });

  // US-02 scenario 2: the API rejects a future date with 400.
  it('passes server validation errors to the form', async () => {
    await flushLists([]);
    const posting = items.post({
      title: 'Keys',
      category: 'Keys',
      place: 'Dorms',
      held: 'With finder',
      foundAt: '2099-01-01T00:00:00.000Z',
      description: '',
      photos: [],
    });
    (await nextRequest((r) => r.method === 'POST')).flush(
      { title: 'One or more validation errors occurred.', errors: { FoundAt: ['In the future.'] } },
      { status: 400, statusText: 'Bad Request' },
    );

    const error = await posting.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).fieldErrors['FoundAt']).toEqual(['In the future.']);
    expect(items.openItems()).toEqual([]);
  });

  it('notifies matching saved searches of other users (local until US-09)', async () => {
    await flushLists([]);
    TestBed.inject(DbStore).update((db) => ({
      ...db,
      savedSearches: [
        {
          id: 's1',
          userId: ARUZHAN.userId,
          name: 'My AirPods',
          category: 'Electronics',
          places: ['Library'],
          query: 'airpods',
          channel: 'PUSH',
          on: true,
          newMatches: 0,
        },
      ],
    }));
    const draft = {
      title: 'AirPods case',
      description: '',
      category: 'Electronics',
      place: 'Library',
    } as const;
    expect(items.countMatchingSearches(draft)).toBe(1);

    const posting = items.post({
      ...draft,
      held: 'With finder',
      foundAt: new Date().toISOString(),
      photos: [],
    });
    (await nextRequest((r) => r.method === 'POST')).flush(
      apiItem({ name: 'AirPods case', category: ApiItemCategory.Electronics, cabinet: 'Library' }),
    );
    await posting;

    const db = TestBed.inject(DbStore).db();
    expect(db.notifications[0]).toMatchObject({
      userId: ARUZHAN.userId,
      title: 'New match for “My AirPods”: AirPods case',
    });
  });

  it('marks my item returned with PATCH and removes it from Browse', async () => {
    const mine = apiItem({ number: 20, userFoundId: DANIYAR.userId });
    await flushLists([mine], [mine]);

    const marking = items.markReturned('0020');
    const req = await nextRequest((r) => r.method === 'PATCH');
    expect(req.request.url).toBe(`/api/items/${mine.id}/returned`);
    req.flush(null, { status: 204, statusText: 'No Content' });
    await marking;

    expect(items.openItems()).toEqual([]);
    expect(items.byNo('0020')?.status).toBe('returned');
  });

  it("doesn't call the API to return someone else's item", async () => {
    await flushLists([
      apiItem({ number: 21, userFoundId: ARUZHAN.userId, status: ApiFoundItemStatus.Open }),
    ]);
    await items.markReturned('0021');
    http.expectNone((r) => r.method === 'PATCH');
  });

  it('loads an item by number for the detail page', async () => {
    await flushLists([]);
    const loading = items.load('0099');
    (await nextRequest((r) => r.url === '/api/items/99')).flush(apiItem({ number: 99 }));
    expect((await loading)?.no).toBe('0099');

    const missing = items.load('0404');
    (await nextRequest((r) => r.url === '/api/items/404')).flush(null, {
      status: 404,
      statusText: 'Not Found',
    });
    expect(await missing).toBeUndefined();
  });
});
