import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ARUZHAN, nextRequest, settle } from '../../../testing/api-fakes';
import { SignIn } from '../../features/auth/sign-in';
import { apiErrorInterceptor } from '../api/api-error.interceptor';
import { authInterceptor } from './auth.interceptor';
import { authGuard, guestGuard } from './auth.guard';

@Component({ template: 'item page' })
class FakeItemPage {}

// US-01, GWT: Given I am not signed in, When I open any page and sign in with my
// @kbtu.kz account, Then I land on the page I asked for.

describe('Sign-in flow (US-01)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: 'signin', component: SignIn, canActivate: [guestGuard] },
            { path: 'item/:no', component: FakeItemPage, canActivate: [authGuard] },
          ],
          withComponentInputBinding(),
        ),
        provideHttpClient(withInterceptors([apiErrorInterceptor, authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
  });

  it('redirects to sign-in and returns to the requested page afterwards', async () => {
    const harness = await RouterTestingHarness.create();
    const router = TestBed.inject(Router);

    // Given I'm not signed in, When I open an item link
    await harness.navigateByUrl('/item/0412');
    expect(router.url).toBe('/signin?next=%2Fitem%2F0412');

    // When I sign in with my KBTU login
    const input = harness.routeNativeElement!.querySelector<HTMLInputElement>('#login')!;
    input.value = 'a_seitkali';
    input.dispatchEvent(new Event('input'));
    harness.routeNativeElement!.querySelector('form')!.dispatchEvent(new Event('submit'));

    (await nextRequest((r) => r.url === '/api/me')).flush(ARUZHAN);
    await settle();
    await harness.fixture.whenStable();

    // Then I land on the page I asked for
    expect(router.url).toBe('/item/0412');
    TestBed.inject(HttpTestingController).verify();
  });
});
