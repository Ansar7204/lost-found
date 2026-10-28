import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { DANIYAR, apiItem, flushLists, signInAs } from '../../../testing/api-fakes';
import { apiErrorInterceptor } from '../../core/api/api-error.interceptor';
import { ApiItemCategory } from '../../core/api/api.types';
import { authInterceptor } from '../../core/auth/auth.interceptor';
import { Browse } from './browse';

// US-03 · Browse by category.
// Given 8 open items exist, 2 are Electronics,
// When I select category "Electronics",
// Then exactly those 2 items are shown, newest first.

describe('Browse (US-03)', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '', component: Browse }], withComponentInputBinding()),
        provideHttpClient(withInterceptors([apiErrorInterceptor, authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    await signInAs(DANIYAR);
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

  it('shows only Electronics, newest first', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');

    const others = [1, 2, 3, 4, 5, 6].map((n) =>
      apiItem({ number: n, category: ApiItemCategory.Keys, foundAt: hoursAgo(n) }),
    );
    const olderPhone = apiItem({
      number: 7,
      name: 'Phone',
      category: ApiItemCategory.Electronics,
      foundAt: hoursAgo(5),
    });
    const newerCase = apiItem({
      number: 8,
      name: 'AirPods case',
      category: ApiItemCategory.Electronics,
      foundAt: hoursAgo(1),
    });
    await flushLists([...others, olderPhone, newerCase]);
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelectorAll('app-tag-card')).toHaveLength(8);

    // When I select "Electronics" in the sidebar
    const button = [
      ...harness.routeNativeElement!.querySelectorAll<HTMLButtonElement>('.sidebar button'),
    ].find((b) => b.textContent?.trim() === 'Electronics')!;
    button.click();
    await harness.fixture.whenStable();
    harness.detectChanges();

    const titles = [...harness.routeNativeElement!.querySelectorAll('app-tag-card .title')].map(
      (t) => t.textContent?.trim(),
    );
    expect(titles).toEqual(['AirPods case', 'Phone']);
  });

  it('shows the empty state when nothing matches', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/?cat=Bottles');
    await flushLists([apiItem({ category: ApiItemCategory.Keys })]);
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('No matches yet');
  });
});
