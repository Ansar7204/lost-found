import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { routes } from './app.routes';
import { apiErrorInterceptor } from './core/api/api-error.interceptor';
import { authInterceptor } from './core/auth/auth.interceptor';
import { AuthService } from './core/auth/auth.service';
import { PageTitleStrategy } from './core/page-title.strategy';

/**
 * Application-wide providers (what NgModule `providers` used to be).
 * No zone.js: Angular 22 apps are zoneless and re-render from signals.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Route params (:no) and query params (?q=) arrive as component inputs.
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
    // Order matters: apiErrorInterceptor is outermost, so authInterceptor still sees raw 401s.
    provideHttpClient(withFetch(), withInterceptors([apiErrorInterceptor, authInterceptor])),
    // Restore the session (MSAL redirect / dev user) before the first route guard runs.
    provideAppInitializer(() => inject(AuthService).init()),
    { provide: TitleStrategy, useClass: PageTitleStrategy },
  ],
};
