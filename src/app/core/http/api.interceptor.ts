import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

/**
 * HTTP Interceptor for API requests
 *
 * Note: Bearer token authentication is handled by MsalInterceptor
 * which is configured in app.config.ts to automatically add
 * Authorization headers for protected resources (see protectedResourceMap).
 *
 * This interceptor handles:
 * - Content-Type headers for JSON requests
 * - Global error handling
 * - Error response mapping to standardized AppError format
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  let clonedRequest = req;

  // Only add Content-Type for JSON requests (not for FormData/file uploads)
  if (shouldAddJsonContentType(req)) {
    clonedRequest = req.clone({
      setHeaders: {
        'Content-Type': 'application/json',
      },
    });
  }

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // Map HTTP errors to application errors
      const appError = mapHttpError(error);

      // Log error in development (skip silent auth errors)
      if (!error.url?.includes('silent')) {
        console.error('HTTP Error:', {
          url: error.url,
          status: error.status,
          message: appError.message,
          details: appError.details,
        });
      }

      return throwError(() => appError);
    })
  );
};

/**
 * Determines if Content-Type: application/json should be added
 * Skips for FormData (file uploads) and requests that already have Content-Type
 */
function shouldAddJsonContentType(req: HttpRequest<any>): boolean {
  // Skip if Content-Type is already set
  if (req.headers.has('Content-Type')) {
    return false;
  }

  // Skip for FormData (file uploads)
  if (req.body instanceof FormData) {
    return false;
  }

  // Skip for GET, HEAD, DELETE (no body)
  if (['GET', 'HEAD', 'DELETE'].includes(req.method)) {
    return false;
  }

  // Add for POST, PUT, PATCH with JSON body
  return true;
}

/**
 * Maps HTTP errors to application-friendly error objects
 */
function mapHttpError(error: HttpErrorResponse): AppError {
  // Client-side or network error
  if (error.error instanceof ErrorEvent) {
    return {
      type: 'client',
      message: error.error.message || 'A network error occurred',
      statusCode: 0,
    };
  }

  // Server-side error with ProblemDetails format (RFC 7807)
  if (error.error && typeof error.error === 'object' && 'title' in error.error) {
    return {
      type: 'server',
      message: error.error.title || error.error.detail || 'An error occurred',
      statusCode: error.status,
      details: error.error,
    };
  }

  // Standard HTTP errors
  const statusMessages: Record<number, string> = {
    400: 'Bad Request: The request was invalid',
    401: 'Unauthorized: Please sign in',
    403: 'Forbidden: You don\'t have permission to access this resource',
    404: 'Not Found: The requested resource was not found',
    409: 'Conflict: The request conflicts with existing data',
    422: 'Validation Error: Please check your input',
    429: 'Too Many Requests: Please try again later',
    500: 'Internal Server Error: Something went wrong',
    502: 'Bad Gateway: The server is temporarily unavailable',
    503: 'Service Unavailable: The server is temporarily unavailable',
    504: 'Gateway Timeout: The request timed out',
  };

  const message = statusMessages[error.status]
    || error.error?.message
    || error.message
    || 'An unexpected error occurred';

  return {
    type: 'server',
    message,
    statusCode: error.status,
    details: error.error,
  };
}

/**
 * Application error interface
 * Standardized error format for the entire application
 */
export interface AppError {
  type: 'client' | 'server';
  message: string;
  statusCode: number;
  details?: unknown;
}
