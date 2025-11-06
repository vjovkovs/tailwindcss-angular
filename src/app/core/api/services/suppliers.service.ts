import { Injectable } from '@angular/core';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { PaginatedResponse, PaginationParams, SupplierDetailsResponse } from '../models';
import { PaginatedSupplierResponseSchema, SupplierDetailsResponseSchema } from '../schemas';
import { BaseApiService } from './base-api.service';

/**
 * Suppliers Service (TanStack Query Exclusive)
 *
 * Uses TanStack Query for all operations:
 * - Automatic caching and cache invalidation
 * - Background refetching
 * - Optimistic updates
 * - Loading and error states
 */
@Injectable({
  providedIn: 'root',
})
export class SuppliersService extends BaseApiService {
  private readonly endpoint = '/api/Suppliers';
  private queryClient = injectQueryClient();

  /**
   * Query for all suppliers with pagination
   * Usage: suppliers = this.suppliersService.getSuppliersQuery(params);
   * Access data: suppliers.data(), suppliers.isLoading(), suppliers.error()
   */
  getSuppliersQuery(params?: PaginationParams) {
    const httpParams = this.buildParams(params);
    return injectQuery(() => ({
      queryKey: ['suppliers', 'list', params] as const,
      queryFn: () =>
        this.toPromise(
          this.get<PaginatedResponse<SupplierDetailsResponse>>(
            this.endpoint,
            PaginatedSupplierResponseSchema,
            httpParams
          )
        ),
      staleTime: 1000 * 60 * 5, // 5 minutes
    }));
  }

  /**
   * Query for a specific supplier by number
   * Usage: supplier = this.suppliersService.getSupplierQuery(supplierNumber);
   * Access data: supplier.data(), supplier.isLoading(), supplier.error()
   */
  getSupplierQuery(supplierNumber: string | null) {
    return injectQuery(() => ({
      queryKey: ['suppliers', 'detail', supplierNumber] as const,
      queryFn: () =>
        this.toPromise(
          this.get<SupplierDetailsResponse>(
            `${this.endpoint}/${supplierNumber}`,
            SupplierDetailsResponseSchema
          )
        ),
      enabled: !!supplierNumber,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }));
  }

  /**
   * Query for searching suppliers
   * Usage: results = this.suppliersService.searchSuppliersQuery(searchTerm, params);
   * Access data: results.data(), results.isLoading(), results.error()
   */
  searchSuppliersQuery(searchTerm: string, params?: PaginationParams) {
    const httpParams = this.buildParams({
      ...params,
      search: searchTerm,
    });
    return injectQuery(() => ({
      queryKey: ['suppliers', 'search', searchTerm, params] as const,
      queryFn: () =>
        this.toPromise(
          this.get<PaginatedResponse<SupplierDetailsResponse>>(
            `${this.endpoint}/search`,
            PaginatedSupplierResponseSchema,
            httpParams
          )
        ),
      enabled: !!searchTerm && searchTerm.length > 0,
      staleTime: 1000 * 60 * 2, // 2 minutes (searches can be more volatile)
    }));
  }

  /**
   * Mutation for creating a supplier (placeholder for future API support)
   * Usage: const createMutation = this.suppliersService.createSupplierMutation();
   * Call: createMutation.mutate(supplierData)
   */
  createSupplierMutation() {
    return injectMutation(() => ({
      mutationFn: async (data: Partial<SupplierDetailsResponse>) => {
        // TODO: Implement when API supports it
        throw new Error('Create supplier endpoint not yet implemented');
        // return this.toPromise(this.post(this.endpoint, data, SupplierDetailsResponseSchema));
      },
      onSuccess: () => {
        // Invalidate and refetch suppliers list
        this.queryClient.invalidateQueries({ queryKey: ['suppliers', 'list'] });
      },
    }));
  }

  /**
   * Mutation for updating a supplier (placeholder for future API support)
   * Usage: const updateMutation = this.suppliersService.updateSupplierMutation();
   * Call: updateMutation.mutate({ supplierNumber, ...data })
   */
  updateSupplierMutation() {
    return injectMutation(() => ({
      mutationFn: async (data: SupplierDetailsResponse) => {
        // TODO: Implement when API supports it
        throw new Error('Update supplier endpoint not yet implemented');
        // return this.toPromise(
        //   this.put(`${this.endpoint}/${data.supplierNumber}`, data, SupplierDetailsResponseSchema)
        // );
      },
      onSuccess: (_, variables) => {
        // Invalidate specific supplier and list
        this.queryClient.invalidateQueries({ queryKey: ['suppliers', 'detail', variables.supplierNumber] });
        this.queryClient.invalidateQueries({ queryKey: ['suppliers', 'list'] });
      },
    }));
  }

  /**
   * Mutation for deleting a supplier (placeholder for future API support)
   * Usage: const deleteMutation = this.suppliersService.deleteSupplierMutation();
   * Call: deleteMutation.mutate(supplierNumber)
   */
  deleteSupplierMutation() {
    return injectMutation(() => ({
      mutationFn: async (supplierNumber: string) => {
        // TODO: Implement when API supports it
        throw new Error('Delete supplier endpoint not yet implemented');
        // return this.toPromise(this.delete(`${this.endpoint}/${supplierNumber}`));
      },
      onSuccess: (_, supplierNumber) => {
        // Remove from cache and invalidate list
        this.queryClient.removeQueries({ queryKey: ['suppliers', 'detail', supplierNumber] });
        this.queryClient.invalidateQueries({ queryKey: ['suppliers', 'list'] });
      },
    }));
  }
}
