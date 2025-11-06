import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { z } from 'zod';
import {
  AuditResponse,
  AuditTypeResponse,
  CreateAuditRequest,
  PaginatedResponse,
  PaginationParams,
  UpdateAuditRequest,
} from '../models';
import {
  AuditResponseSchema,
  AuditTypeResponseSchema,
  CreateAuditRequestSchema,
  PaginatedResponseSchema,
  UpdateAuditRequestSchema,
} from '../schemas';
import { BaseApiService } from './base-api.service';

/**
 * Audits Service (Hybrid: TanStack Query + Observable)
 *
 * Provides both Observable-based and TanStack Query methods:
 * - TanStack Query: For components that need automatic caching and refetching
 * - Observable: For one-off operations like form loading and submissions
 */
@Injectable({
  providedIn: 'root',
})
export class AuditsService extends BaseApiService {
  private readonly endpoint = '/api/Audits';
  private queryClient = injectQueryClient();

  // ============================================================================
  // Observable Methods (for backward compatibility and one-off operations)
  // ============================================================================

  /**
   * Get all audits with pagination (Observable)
   */
  getAllAudits(params?: PaginationParams): Observable<PaginatedResponse<AuditResponse>> {
    const httpParams = this.buildParams(params);
    return this.get(this.endpoint, PaginatedResponseSchema(AuditResponseSchema), httpParams);
  }

  /**
   * Create a new audit (Observable)
   */
  createAudit(request: CreateAuditRequest): Observable<AuditResponse> {
    return this.post(this.endpoint, request, AuditResponseSchema, CreateAuditRequestSchema);
  }

  /**
   * Get audit by ID (Observable)
   */
  getAuditById(id: number): Observable<AuditResponse> {
    return this.get(`${this.endpoint}/${id}`, AuditResponseSchema);
  }

  /**
   * Update an existing audit (Observable)
   */
  updateAudit(id: number, request: UpdateAuditRequest): Observable<AuditResponse> {
    return this.put(`${this.endpoint}/${id}`, request, AuditResponseSchema, UpdateAuditRequestSchema);
  }

  /**
   * Delete an audit (Observable)
   */
  deleteAudit(id: number): Observable<void> {
    return this.delete(`${this.endpoint}/${id}`);
  }

  /**
   * Get audit by audit number (Observable)
   */
  getAuditByNumber(auditNumber: string): Observable<AuditResponse> {
    return this.get(`${this.endpoint}/number/${auditNumber}`, AuditResponseSchema);
  }

  /**
   * Get audits by supplier number (Observable)
   */
  getAuditsBySupplier(
    supplierNumber: string,
    params?: PaginationParams
  ): Observable<PaginatedResponse<AuditResponse>> {
    const httpParams = this.buildParams(params);
    return this.get(
      `${this.endpoint}/supplier/${supplierNumber}`,
      PaginatedResponseSchema(AuditResponseSchema),
      httpParams
    );
  }

  /**
   * Approve an audit (Observable)
   */
  approveAudit(id: number): Observable<AuditResponse> {
    return this.post(`${this.endpoint}/${id}/approve`, {}, AuditResponseSchema);
  }

  /**
   * Get available audit types (Observable)
   */
  getAuditTypes(): Observable<AuditTypeResponse[]> {
    return this.get(`${this.endpoint}/types`, z.array(AuditTypeResponseSchema));
  }

  // ============================================================================
  // TanStack Query Methods (for automatic caching and refetching)
  // ============================================================================

  /**
   * Query for all audits with pagination
   * Usage: audits = this.auditsService.getAllAuditsQuery(params);
   * Access data: audits.data(), audits.isLoading(), audits.error()
   */
  getAllAuditsQuery(params?: PaginationParams) {
    const httpParams = this.buildParams(params);
    return injectQuery(() => ({
      queryKey: ['audits', 'list', params] as const,
      queryFn: () =>
        this.toPromise(
          this.get<PaginatedResponse<AuditResponse>>(
            this.endpoint,
            PaginatedResponseSchema(AuditResponseSchema),
            httpParams
          )
        ),
      staleTime: 1000 * 60 * 5, // 5 minutes
    }));
  }

  /**
   * Query for a specific audit by ID
   * Usage: audit = this.auditsService.getAuditByIdQuery(id);
   * Access data: audit.data(), audit.isLoading(), audit.error()
   */
  getAuditByIdQuery(id: number | null) {
    return injectQuery(() => ({
      queryKey: ['audits', 'detail', id] as const,
      queryFn: () =>
        this.toPromise(this.get<AuditResponse>(`${this.endpoint}/${id}`, AuditResponseSchema)),
      enabled: !!id,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }));
  }

  /**
   * Query for a specific audit by audit number
   * Usage: audit = this.auditsService.getAuditByNumberQuery(auditNumber);
   * Access data: audit.data(), audit.isLoading(), audit.error()
   */
  getAuditByNumberQuery(auditNumber: string | null) {
    return injectQuery(() => ({
      queryKey: ['audits', 'number', auditNumber] as const,
      queryFn: () =>
        this.toPromise(
          this.get<AuditResponse>(`${this.endpoint}/number/${auditNumber}`, AuditResponseSchema)
        ),
      enabled: !!auditNumber,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }));
  }

  /**
   * Query for audits by supplier number
   * Usage: audits = this.auditsService.getAuditsBySupplierQuery(supplierNumber, params);
   * Access data: audits.data(), audits.isLoading(), audits.error()
   */
  getAuditsBySupplierQuery(supplierNumber: string | null, params?: PaginationParams) {
    const httpParams = this.buildParams(params);
    return injectQuery(() => ({
      queryKey: ['audits', 'supplier', supplierNumber, params] as const,
      queryFn: () =>
        this.toPromise(
          this.get<PaginatedResponse<AuditResponse>>(
            `${this.endpoint}/supplier/${supplierNumber}`,
            PaginatedResponseSchema(AuditResponseSchema),
            httpParams
          )
        ),
      enabled: !!supplierNumber,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }));
  }

  /**
   * Query for audit types
   * Usage: auditTypes = this.auditsService.getAuditTypesQuery();
   * Access data: auditTypes.data(), auditTypes.isLoading(), auditTypes.error()
   */
  getAuditTypesQuery() {
    return injectQuery(() => ({
      queryKey: ['audits', 'types'] as const,
      queryFn: () =>
        this.toPromise(
          this.get<AuditTypeResponse[]>(`${this.endpoint}/types`, z.array(AuditTypeResponseSchema))
        ),
      staleTime: 1000 * 60 * 30, // 30 minutes (audit types rarely change)
    }));
  }

  /**
   * Mutation for creating a new audit
   * Usage: const createMutation = this.auditsService.createAuditMutation();
   * Call: createMutation.mutate(auditData)
   */
  createAuditMutation() {
    return injectMutation(() => ({
      mutationFn: async (request: CreateAuditRequest) => {
        return this.toPromise(
          this.post<CreateAuditRequest, AuditResponse>(
            this.endpoint,
            request,
            AuditResponseSchema,
            CreateAuditRequestSchema
          )
        );
      },
      onSuccess: () => {
        // Invalidate audits list to refetch
        this.queryClient.invalidateQueries({ queryKey: ['audits', 'list'] });
      },
    }));
  }

  /**
   * Mutation for updating an existing audit
   * Usage: const updateMutation = this.auditsService.updateAuditMutation();
   * Call: updateMutation.mutate({ id, request })
   */
  updateAuditMutation() {
    return injectMutation(() => ({
      mutationFn: async ({ id, request }: { id: number; request: UpdateAuditRequest }) => {
        return this.toPromise(
          this.put<UpdateAuditRequest, AuditResponse>(
            `${this.endpoint}/${id}`,
            request,
            AuditResponseSchema,
            UpdateAuditRequestSchema
          )
        );
      },
      onSuccess: (_, variables) => {
        // Invalidate specific audit and list
        this.queryClient.invalidateQueries({ queryKey: ['audits', 'detail', variables.id] });
        this.queryClient.invalidateQueries({ queryKey: ['audits', 'list'] });
      },
    }));
  }

  /**
   * Mutation for deleting an audit
   * Usage: const deleteMutation = this.auditsService.deleteAuditMutation();
   * Call: deleteMutation.mutate(id)
   */
  deleteAuditMutation() {
    return injectMutation(() => ({
      mutationFn: async (id: number) => {
        return this.toPromise(this.delete(`${this.endpoint}/${id}`));
      },
      onSuccess: (_, id) => {
        // Remove from cache and invalidate list
        this.queryClient.removeQueries({ queryKey: ['audits', 'detail', id] });
        this.queryClient.invalidateQueries({ queryKey: ['audits', 'list'] });
      },
    }));
  }

  /**
   * Mutation for approving an audit
   * Usage: const approveMutation = this.auditsService.approveAuditMutation();
   * Call: approveMutation.mutate(id)
   */
  approveAuditMutation() {
    return injectMutation(() => ({
      mutationFn: async (id: number) => {
        return this.toPromise(
          this.post<{}, AuditResponse>(`${this.endpoint}/${id}/approve`, {}, AuditResponseSchema)
        );
      },
      onSuccess: (_, id) => {
        // Invalidate specific audit and list
        this.queryClient.invalidateQueries({ queryKey: ['audits', 'detail', id] });
        this.queryClient.invalidateQueries({ queryKey: ['audits', 'list'] });
      },
    }));
  }
}
