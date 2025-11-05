import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResponse, PaginationParams, SupplierDetailsResponse } from '../models';
import { PaginatedSupplierResponseSchema, SupplierDetailsResponseSchema } from '../schemas';
import { BaseApiService } from './base-api.service';

/**
 * Suppliers Service
 *
 * Provides access to supplier data:
 * - Get all suppliers with pagination
 * - Get specific supplier by number
 * - Search suppliers
 */
@Injectable({
  providedIn: 'root',
})
export class SuppliersService extends BaseApiService {
  private readonly endpoint = '/api/Suppliers';

  /**
   * Get all suppliers with pagination and search
   */
  getSuppliers(
    params?: PaginationParams
  ): Observable<PaginatedResponse<SupplierDetailsResponse>> {
    const httpParams = this.buildParams(params);
    return this.get(
      this.endpoint,
      PaginatedSupplierResponseSchema,
      httpParams
    );
  }

  /**
   * Get supplier by supplier number
   */
  getSupplier(supplierNumber: string): Observable<SupplierDetailsResponse> {
    return this.get(`${this.endpoint}/${supplierNumber}`, SupplierDetailsResponseSchema);
  }

  /**
   * Search suppliers
   */
  searchSuppliers(searchTerm: string, params?: PaginationParams): Observable<PaginatedResponse<SupplierDetailsResponse>> {
    const httpParams = this.buildParams({
      ...params,
      search: searchTerm,
    });
    return this.get(
      `${this.endpoint}/search`,
      PaginatedSupplierResponseSchema,
      httpParams
    );
  }
}
