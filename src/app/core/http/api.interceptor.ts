import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

/**
 * HTTP Interceptor for API requests
 * - Adds authorization headers
 * - Handles errors globally
 * - Maps error responses to application errors
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  // Clone request and add headers if needed
  const clonedRequest = req.clone({
    setHeaders: {
      'Content-Type': 'application/json',
      // Add authorization header here when auth is implemented
      // Authorization: `Bearer ${token}`
    },
  });

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // Map HTTP errors to application errors
      const appError = mapHttpError(error);
      console.error('HTTP Error:', appError);
      return throwError(() => appError);
    })
  );
};

/**
 * Maps HTTP errors to application-friendly error objects
 */
function mapHttpError(error: HttpErrorResponse): AppError {
  if (error.error instanceof ErrorEvent) {
    // Client-side error
    return {
      type: 'client',
      message: error.error.message,
      statusCode: 0,
    };
  }

  // Server-side error
  return {
    type: 'server',
    message: error.error?.message || error.message || 'An unexpected error occurred',
    statusCode: error.status,
    details: error.error,
  };
}

export interface AppError {
  type: 'client' | 'server';
  message: string;
  statusCode: number;
  details?: unknown;
}
