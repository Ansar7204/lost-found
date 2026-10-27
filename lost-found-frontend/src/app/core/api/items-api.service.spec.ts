import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ApiError, apiErrorInterceptor } from './api-error.interceptor';
import { ApiFoundItemStatus, ApiItemCategory } from './api.types';
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
    const result = firstValueFrom(api.search({ category: ApiItemCategory.Keys, page: 2 }));

    const req = http.expectOne((r) => r.url === '/api/items');
    expect(req.request.params.get('category')).toBe('4');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.has('cabinet')).toBe(false);

    req.flush({
      items: [
        {
          id: 'abcd0000-0000',
          name: 'Keys',
          category: ApiItemCategory.Keys,
          cabinet: 'Dorms',
          status: ApiFoundItemStatus.Open,
          createdAt: '2026-09-30T10:00:00Z',
        },
      ],
      totalCount: 21,
      page: 2,
      pageSize: 20,
    });

    const page = await result;
    expect(page.totalCount).toBe(21);
    expect(page.items[0]).toMatchObject({ title: 'Keys', place: 'Dorms', category: 'Keys' });
  });

  it('turns ASP.NET validation errors into an ApiError', async () => {
    const result = firstValueFrom(
      api.create({
        title: 'X',
        description: '',
        category: 'Keys',
        place: 'Dorms',
        foundAt: '2030-01-01T00:00:00Z',
      }),
    );

    http.expectOne({ method: 'POST', url: '/api/items' }).flush(
      {
        title: 'One or more validation errors occurred.',
        errors: { FoundAt: ['Дата находки не может быть в будущем.'] },
      },
      { status: 400, statusText: 'Bad Request' },
    );

    const error = await result.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).fieldErrors['FoundAt']).toHaveLength(1);
  });

  it('marks an item returned with PATCH', async () => {
    const result = firstValueFrom(api.markReturned('abc'));
    const req = http.expectOne('/api/items/abc/returned');
    expect(req.request.method).toBe('PATCH');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await result;
  });
});
