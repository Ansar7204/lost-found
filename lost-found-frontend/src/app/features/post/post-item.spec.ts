import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  DANIYAR,
  apiItem,
  flushLists,
  nextRequest,
  settle,
  signInAs,
} from '../../../testing/api-fakes';
import { apiErrorInterceptor } from '../../core/api/api-error.interceptor';
import { ApiItemCategory } from '../../core/api/api.types';
import { authInterceptor } from '../../core/auth/auth.interceptor';
import { toLocalInputValue } from '../../core/util/image';
import { LIMITS, PostItem } from './post-item';

@Component({ template: 'item page' })
class FakeItemPage {}

// US-02 · Post a found item.

describe('Post a found item (US-02)', () => {
  let harness: RouterTestingHarness;
  let el: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'post', component: PostItem },
          { path: 'item/:no', component: FakeItemPage },
        ]),
        provideHttpClient(withInterceptors([apiErrorInterceptor, authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    await signInAs(DANIYAR);
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/post');
    await flushLists([]); // the store loads lists once it exists
    el = harness.routeNativeElement!;
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  const set = (selector: string, value: string) => {
    const input = el.querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input'));
    input.dispatchEvent(new Event('blur')); // errors show once a field was touched
    harness.detectChanges();
  };
  const postButton = () => el.querySelector<HTMLButtonElement>('button[type=submit]')!;

  const fillValid = () => {
    set('#title', 'AirPods Pro case');
    set('#category', 'Electronics');
    set('#place', 'Library');
    set('[aria-label="Place detail"]', '2nd floor');
  };

  // Scenario 1: Given I am signed in, When I fill the form and press "Post item",
  // Then I am taken to the new item page with its Nº.
  it('posts and opens the new item', async () => {
    fillValid();
    expect(postButton().disabled).toBe(false);
    postButton().click();

    const req = await nextRequest((r) => r.method === 'POST' && r.url === '/api/items');
    expect(req.request.body).toMatchObject({
      name: 'AirPods Pro case',
      category: ApiItemCategory.Electronics,
      cabinet: 'Library · 2nd floor',
    });
    req.flush(apiItem({ number: 413, name: 'AirPods Pro case' }), {
      status: 201,
      statusText: 'Created',
    });
    await settle();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/item/0413');
  });

  // Scenario 2: Given the form is open, When the title is empty or the time is in the future,
  // Then "Post item" stays disabled and the field shows an error.
  it('keeps "Post item" disabled for an empty title', () => {
    fillValid();
    set('#title', '');
    expect(postButton().disabled).toBe(true);
    expect(el.textContent).toContain('Say what you found.');
  });

  it('keeps "Post item" disabled for a time in the future', () => {
    fillValid();
    set('#foundAt', toLocalInputValue(new Date(Date.now() + 86_400_000)));
    expect(postButton().disabled).toBe(true);
    expect(el.textContent).toContain("That's in the future.");
  });

  it('limits the title to 150 and the description to 1024 characters', () => {
    expect(LIMITS).toMatchObject({ title: 150, description: 1024 });
    expect(el.querySelector('#title')!.getAttribute('maxlength')).toBe('150');
    expect(el.querySelector('#description')!.getAttribute('maxlength')).toBe('1024');
  });

  it("shows the API's validation message next to the field", async () => {
    fillValid();
    postButton().click();
    (await nextRequest((r) => r.method === 'POST')).flush(
      {
        title: 'One or more validation errors occurred.',
        errors: { FoundAt: ["The date found can't be in the future."] },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();
    harness.detectChanges();

    expect(el.textContent).toContain("The date found can't be in the future.");
    expect(TestBed.inject(Router).url).toBe('/post');
  });
});
