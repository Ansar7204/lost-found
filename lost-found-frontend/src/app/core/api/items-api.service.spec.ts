import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { apiItem } from '../../../testing/api-fakes';
import { ApiError, apiErrorInterceptor } from './api-error.interceptor';
import { ApiItemCategory } from './api.types';
import { ItemsApiService } from './items-api.service';

// HttpTestingController fakes the network: we assert which request was sent
// and answer it ourselves. No backend needed.

describe('ItemsApiService', () => {
  let api: ItemsApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    api = TestBed.inject(ItemsApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends only the filters that are set', async () => {
    const result = firstValueFrom(
      api.search({ category: ApiItemCategory.Keys, page: 2, mine: false }),
    );

    const req = http.expectOne((r) => r.url === '/api/items');
    expect(req.request.params.get('category')).toBe('4');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.has('cabinet')).toBe(false);
    expect(req.request.params.has('mine')).toBe(false);

    req.flush({
      items: [apiItem({ name: 'Keys', category: ApiItemCategory.Keys, cabinet: 'Dorms' })],
      totalCount: 21,
      page: 2,
      pageSize: 20,
    });

    const page = await result;
    expect(page.totalCount).toBe(21);
    expect(page.items[0]).toMatchObject({ title: 'Keys', place: 'Dorms', category: 'Keys' });
  });

  it('gets an item by its short number', async () => {
    const result = firstValueFrom(api.getByNo('0413'));
    http.expectOne('/api/items/413').flush(apiItem({ number: 413 }));
    expect((await result).no).toBe('0413');
  });

  it('turns ASP.NET validation errors into an ApiError', async () => {
    const result = firstValueFrom(
      api.create({
        title: 'X',
        description: '',
        category: 'Keys',
        place: 'Dorms',
        held: 'With finder',
        foundAt: '2030-01-01T00:00:00Z',
      }),
    );

    http.expectOne({ method: 'POST', url: '/api/items' }).flush(
      {
        title: 'One or more validation errors occurred.',
        errors: { FoundAt: ["The date found can't be in the future."] },
      },
      { status: 400, statusText: 'Bad Request' },
    );

    const error = await result.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).fieldErrors['FoundAt']).toHaveLength(1);
  });

  it('uploads a photo as multipart form data', async () => {
    const result = firstValueFrom(api.uploadPhoto('abc', new Blob(['x'], { type: 'image/jpeg' })));
    const req = http.expectOne({ method: 'POST', url: '/api/items/abc/photo' });
    expect(req.request.body).toBeInstanceOf(FormData);
    expect((req.request.body as FormData).has('photo')).toBe(true);
    req.flush({ photoUrl: '/api/items/abc/photo' });
    await result;
  });

  it('marks an item returned with PATCH', async () => {
    const result = firstValueFrom(api.markReturned('abc'));
    const req = http.expectOne('/api/items/abc/returned');
    expect(req.request.method).toBe('PATCH');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await result;
  });
});
