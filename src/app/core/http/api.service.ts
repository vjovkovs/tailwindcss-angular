import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Typed HTTP client service wrapper
 * Provides type-safe methods for making API requests
 */
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment?.apiUrl || '/api';

  /**
   * Perform a GET request
   */
  get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Observable<T> {
    const httpParams = this.createHttpParams(params);
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { params: httpParams });
  }

  /**
   * Perform a POST request
   */
  post<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body);
  }

  /**
   * Perform a PUT request
   */
  put<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body);
  }

  /**
   * Perform a PATCH request
   */
  patch<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, body);
  }

  /**
   * Perform a DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`);
  }

  /**
   * Helper to create HttpParams from object
   */
  private createHttpParams(params?: Record<string, string | number | boolean>): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        httpParams = httpParams.set(key, String(params[key]));
      });
    }
    return httpParams;
  }
}
