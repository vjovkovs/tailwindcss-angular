/**
 * Suppliers Query Service
 *
 * Demonstrates TanStack Query integration with BaseApiService
 * Shows how to use queries and mutations for caching and optimistic updates
 *
 * This service extends the regular SuppliersService with TanStack Query methods.
 * Components can choose to use either:
 * - Observable-based methods (direct .subscribe())
 * - TanStack Query methods (injectQuery/injectMutation)
 */

import { Injectable, inject } from '@angular/core';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { BaseApiService } from './base-api.service';
import { SupplierDetailsResponse, PaginatedResponse } from '../models';
import { SupplierDetailsResponseSchema, PaginatedSupplierResponseSchema } from '../schemas';
import { PaginationParams } from '../models';

/**
 * Example TanStack Query service for Suppliers
 *
 * Usage in components:
 *
 * @example
 * // Inject the service
 * private suppliersQueryService = inject(SuppliersQueryService);
 *
 * // Use the pre-configured query
 * suppliers = this.suppliersQueryService.suppliers;
 *
 * // Access query state in template
 * <div *ngIf="suppliers.isLoading()">Loading...</div>
 * <div *ngIf="suppliers.error()">Error: {{ suppliers.error().message }}</div>
 * <div *ngFor="let supplier of suppliers.data()?.items">
 *   {{ supplier.supplierName }}
 * </div>
 */
@Injectable({
  providedIn: 'root',
})
export class SuppliersQueryService extends BaseApiService {
  private queryClient = injectQueryClient();

  /**
   * TanStack Query for fetching all suppliers
   * Includes automatic caching, refetching, and loading states
   *
   * Query key: ['suppliers', 'list', pageNumber, pageSize]
   */
  suppliers = injectQuery(() => ({
    queryKey: ['suppliers', 'list'] as const,
    queryFn: () => this.toPromise(
      this.get<PaginatedResponse<SupplierDetailsResponse>>(
        '/api/Suppliers',
        PaginatedSupplierResponseSchema,
        this.buildParams({ pageNumber: 1, pageSize: 100 })
      )
    ),
    staleTime: 1000 * 60 * 5, // 5 minutes
  }));

  /**
   * Create a query for a specific supplier
   * Use this in components to fetch a single supplier by ID
   *
   * @example
   * supplierQuery = this.suppliersQueryService.createSupplierQuery('5592');
   */
  createSupplierQuery(supplierNumber: string) {
    return injectQuery(() => ({
      queryKey: ['suppliers', 'detail', supplierNumber] as const,
      queryFn: () => this.toPromise(
        this.get<SupplierDetailsResponse>(
          `/api/Suppliers/${supplierNumber}`,
          SupplierDetailsResponseSchema
        )
      ),
      enabled: !!supplierNumber,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }));
  }

  /**
   * Create a paginated suppliers query
   * Use this to create a query with specific pagination params
   *
   * @example
   * suppliersQuery = this.suppliersQueryService.createPaginatedQuery({ pageNumber: 1, pageSize: 25 });
   */
  createPaginatedQuery(params: PaginationParams) {
    return injectQuery(() => ({
      queryKey: ['suppliers', 'list', params.pageNumber, params.pageSize, params.search] as const,
      queryFn: () => this.toPromise(
        this.get<PaginatedResponse<SupplierDetailsResponse>>(
          '/api/Suppliers',
          PaginatedSupplierResponseSchema,
          this.buildParams(params)
        )
      ),
      staleTime: 1000 * 60 * 5, // 5 minutes
    }));
  }

  /**
   * Create a search query
   * Use this to search suppliers with automatic caching
   *
   * @example
   * searchQuery = this.suppliersQueryService.createSearchQuery('Acme', { pageNumber: 1, pageSize: 25 });
   */
  createSearchQuery(searchTerm: string, params?: PaginationParams) {
    return injectQuery(() => ({
      queryKey: ['suppliers', 'search', searchTerm, params?.pageNumber, params?.pageSize] as const,
      queryFn: () => this.toPromise(
        this.get<PaginatedResponse<SupplierDetailsResponse>>(
          '/api/Suppliers/search',
          PaginatedSupplierResponseSchema,
          this.buildParams({ ...params, search: searchTerm })
        )
      ),
      enabled: searchTerm.length >= 2, // Only search if term is at least 2 characters
      staleTime: 1000 * 60 * 2, // 2 minutes (shorter for search results)
    }));
  }

  /**
   * Create supplier mutation (when create endpoint is available)
   * This is a placeholder for when the API supports creating suppliers
   *
   * @example
   * const createMutation = this.suppliersQueryService.createSupplierMutation();
   * createMutation.mutate({ supplierName: 'New Supplier', ... });
   */
  createSupplierMutation() {
    return injectMutation(() => ({
      mutationFn: async (data: Partial<SupplierDetailsResponse>) => {
        // TODO: Implement when create endpoint is available
        throw new Error('Create supplier endpoint not yet implemented');
      },
      onSuccess: () => {
        // Invalidate suppliers list to refetch
        this.queryClient.invalidateQueries({ queryKey: ['suppliers', 'list'] });
      },
    }));
  }

  /**
   * Update supplier mutation (when update endpoint is available)
   * This is a placeholder for when the API supports updating suppliers
   *
   * @example
   * const updateMutation = this.suppliersQueryService.updateSupplierMutation();
   * updateMutation.mutate({ supplierNumber: '5592', supplierName: 'Updated Name', ... });
   */
  updateSupplierMutation() {
    return injectMutation(() => ({
      mutationFn: async (data: Partial<SupplierDetailsResponse>) => {
        // TODO: Implement when update endpoint is available
        throw new Error('Update supplier endpoint not yet implemented');
      },
      onSuccess: (data, variables) => {
        // Invalidate both list and detail queries
        this.queryClient.invalidateQueries({ queryKey: ['suppliers', 'list'] });
        if (variables.supplierNumber) {
          this.queryClient.invalidateQueries({
            queryKey: ['suppliers', 'detail', variables.supplierNumber],
          });
        }
      },
    }));
  }

  /**
   * Delete supplier mutation (when delete endpoint is available)
   * This is a placeholder for when the API supports deleting suppliers
   *
   * @example
   * const deleteMutation = this.suppliersQueryService.deleteSupplierMutation();
   * deleteMutation.mutate('5592');
   */
  deleteSupplierMutation() {
    return injectMutation(() => ({
      mutationFn: async (supplierNumber: string) => {
        // TODO: Implement when delete endpoint is available
        throw new Error('Delete supplier endpoint not yet implemented');
      },
      onSuccess: () => {
        // Invalidate suppliers list to refetch
        this.queryClient.invalidateQueries({ queryKey: ['suppliers', 'list'] });
      },
    }));
  }
}
