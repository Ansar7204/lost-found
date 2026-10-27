import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Functional route guard (the modern replacement for class-based guards).
 * Not signed in -> go to /signin and remember where you wanted to go.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isSignedIn()) return true;
  return inject(Router).createUrlTree(['/signin'], { queryParams: { next: state.url } });
};

/** The opposite: a signed-in user has no business on /signin. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isSignedIn() ? inject(Router).createUrlTree(['/']) : true;
};
