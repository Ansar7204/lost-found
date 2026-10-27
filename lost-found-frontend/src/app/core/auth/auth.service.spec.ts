import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ARUZHAN, nextRequest } from '../../../testing/api-fakes';
import { apiErrorInterceptor } from '../api/api-error.interceptor';
import { authInterceptor } from './auth.interceptor';
import { AuthService, nameFromEmail, userFromMe } from './auth.service';

// US-01 · Sign in with the KBTU account (dev mode: the API trusts X-Dev-User).

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor, authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  it('signs in with a @kbtu.kz email and takes the user from GET /api/me', async () => {
    const result = auth.signInDev('A_Seitkali@kbtu.kz ');

    const req = await nextRequest((r) => r.url === '/api/me');
    expect(req.request.headers.get('X-Dev-User')).toBe('a_seitkali@kbtu.kz');
    req.flush(ARUZHAN);

    const user = await result;
    expect(user).toMatchObject({ id: ARUZHAN.userId, name: 'Aruzhan Seitkali', initials: 'AS' });
    expect(auth.isSignedIn()).toBe(true);
    // Survives a reload of this tab.
    expect(sessionStorage.getItem('lf.devUser')).toBe('a_seitkali@kbtu.kz');
  });

  it('does not even call the API for a non-KBTU email', async () => {
    expect(await auth.signInDev('someone@gmail.com')).toBeNull();
    expect(auth.error()).toContain('@kbtu.kz');
    http.expectNone('/api/me');
  });

  it('explains a 403 from the API (account outside KBTU)', async () => {
    const result = auth.signInDev('guest@kbtu.kz');
    (await nextRequest((r) => r.url === '/api/me')).flush(null, {
      status: 403,
      statusText: 'Forbidden',
    });
    expect(await result).toBeNull();
    expect(auth.isSignedIn()).toBe(false);
    expect(auth.error()).toBe('Only @kbtu.kz accounts can use Lost & Found.');
  });

  it('restores the session on start', async () => {
    sessionStorage.setItem('lf.devUser', ARUZHAN.email);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor, authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const fresh = TestBed.inject(AuthService);
    const init = fresh.init();
    (await nextRequest((r) => r.url === '/api/me')).flush(ARUZHAN);
    await init;
    expect(fresh.currentUser()?.email).toBe(ARUZHAN.email);
  });

  it('builds names and initials like the API', () => {
    expect(nameFromEmail('a_seitkali@kbtu.kz')).toBe('Seitkali A.');
    expect(userFromMe({ userId: 'x', name: '', email: 'd_kassym@kbtu.kz' })).toMatchObject({
      name: 'Kassym D.',
      initials: 'KD',
    });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());
});
