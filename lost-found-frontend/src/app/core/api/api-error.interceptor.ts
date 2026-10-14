import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiProblemDetails } from './api.types';

/** A normalized error the UI can show without knowing about HTTP. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Field name -> messages, from ASP.NET ValidationProblem(). */
    readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

/**
 * Functional HTTP interceptor: every request made through HttpClient passes
 * through here. This one turns any failure into an ApiError.
 *
 * Interceptors are where companies put cross-cutting HTTP concerns: auth
 * headers (MSAL adds the Bearer token this way), error handling, retries,
 * logging, loading indicators.
 */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) return throwError(() => error);

      const problem = (error.error ?? {}) as ApiProblemDetails;
      const message =
        error.status === 0
          ? 'Cannot reach the server. Is the API running?'
          : error.status === 401
            ? 'Please sign in again.'
            : error.status === 403
              ? "You don't have permission to do that."
              : (problem.title ?? error.message);

      return throwError(() => new ApiError(error.status, message, problem.errors));
    }),
  );
