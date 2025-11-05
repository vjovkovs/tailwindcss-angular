import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { z } from 'zod';
import { environment } from '../../../../environments/environment';
import { ApiError, ProblemDetails } from '../models';
import { ProblemDetailsSchema } from '../schemas';

/**
 * Base API Service
 *
 * Provides common HTTP functionality for all API services:
 * - HTTP client with automatic authentication (via MSAL interceptor)
 * - Zod schema validation for responses
 * - Standardized error handling
 * - Type-safe request/response handling
 */
@Injectable({
  providedIn: 'root',
})
export class BaseApiService {
  protected readonly http = inject(HttpClient);
  protected readonly baseUrl = environment.apiUrl;

  /**
   * Make a GET request with Zod validation
   */
  protected get<T>(
    endpoint: string,
    schema: z.ZodType<T, any, any>,
    params?: HttpParams | { [param: string]: string | string[] }
  ): Observable<T> {
    return this.http
      .get(`${this.baseUrl}${endpoint}`, { params })
      .pipe(
        map((data) => this.validateResponse(data, schema)),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Make a POST request with Zod validation
   */
  protected post<T, R>(
    endpoint: string,
    body: T,
    responseSchema: z.ZodType<R, any, any>,
    requestSchema?: z.ZodType<T, any, any>
  ): Observable<R> {
    const validatedBody = requestSchema ? requestSchema.parse(body) : body;

    return this.http
      .post(`${this.baseUrl}${endpoint}`, validatedBody)
      .pipe(
        map((data) => this.validateResponse(data, responseSchema)),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Make a PUT request with Zod validation
   */
  protected put<T, R>(
    endpoint: string,
    body: T,
    responseSchema: z.ZodType<R, any, any>,
    requestSchema?: z.ZodType<T, any, any>
  ): Observable<R> {
    const validatedBody = requestSchema ? requestSchema.parse(body) : body;

    return this.http
      .put(`${this.baseUrl}${endpoint}`, validatedBody)
      .pipe(
        map((data) => this.validateResponse(data, responseSchema)),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Make a DELETE request
   */
  protected delete(endpoint: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}${endpoint}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Make a HEAD request (for existence checks)
   */
  protected head(endpoint: string): Observable<boolean> {
    return this.http
      .head(`${this.baseUrl}${endpoint}`, { observe: 'response' })
      .pipe(
        map((response) => response.ok),
        catchError(() => throwError(() => false))
      );
  }

  /**
   * Upload files with multipart/form-data
   */
  protected uploadFiles<R>(
    endpoint: string,
    files: File[],
    responseSchema: z.ZodType<R, any, any>,
    additionalData?: Record<string, string | number>
  ): Observable<R> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file, file.name));

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    }

    return this.http
      .post(`${this.baseUrl}${endpoint}`, formData)
      .pipe(
        map((data) => this.validateResponse(data, responseSchema)),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Download file as Blob
   */
  protected downloadFile(endpoint: string): Observable<Blob> {
    return this.http
      .get(`${this.baseUrl}${endpoint}`, {
        responseType: 'blob',
        observe: 'body',
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Validate response data against Zod schema
   */
  private validateResponse<T>(data: unknown, schema: z.ZodType<T, any, any>): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Response validation failed:', error.errors);
        throw new Error(`Invalid API response: ${error.errors.map((e) => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let apiError: ApiError;

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      apiError = {
        message: error.error.message,
        status: 0,
        originalError: error,
      };
    } else {
      // Server-side error
      let problemDetails: ProblemDetails | undefined;

      // Try to parse ProblemDetails from response
      try {
        if (error.error && typeof error.error === 'object') {
          problemDetails = ProblemDetailsSchema.parse(error.error);
        }
      } catch {
        // Not a ProblemDetails response
      }

      apiError = {
        message: problemDetails?.title || error.message || 'An error occurred',
        status: error.status,
        details: problemDetails,
        originalError: error,
      };
    }

    console.error('API Error:', apiError);
    return throwError(() => apiError);
  }

  /**
   * Build HTTP params from object
   */
  protected buildParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return httpParams;
  }
}
