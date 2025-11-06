import { Injectable } from '@angular/core';
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
 * Audits Service (TanStack Query Exclusive)
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
export class AuditsService extends BaseApiService {
  private readonly endpoint = '/api/Audits';
  private queryClient = injectQueryClient();

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
