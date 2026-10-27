import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Adds credentials to every request to our API:
 * `Authorization: Bearer <token>` (MSAL) or `X-Dev-User: <email>` (dev mode).
 * A 401 on any call except /me sends the user back to sign-in, then back here.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiBaseUrl)) return next(req);

  const auth = inject(AuthService);
  const router = inject(Router);

  return from(auth.authHeaders()).pipe(
    switchMap((headers) => next(req.clone({ setHeaders: headers }))),
    catchError((error: unknown) => {
      const isMe = req.url === `${environment.apiBaseUrl}/me`;
      if (error instanceof HttpErrorResponse && error.status === 401 && !isMe) {
        auth.handleUnauthorized();
        router.navigate(['/signin'], { queryParams: { next: router.url } });
      }
      return throwError(() => error);
    }),
  );
};
