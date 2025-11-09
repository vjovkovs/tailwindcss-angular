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
            `${this.endpoint}/GetAll`,
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
   * Query for searching audits
   * Usage: audits = this.auditsService.searchAuditsQuery({ auditNumber, supplierNumber, fiscalYear });
   * Access data: audits.data(), audits.isLoading(), audits.error()
   */
  searchAuditsQuery(params: { auditNumber?: string; supplierNumber?: string; fiscalYear?: number }) {
    const httpParams = this.buildParams(params);
    return injectQuery(() => ({
      queryKey: ['audits', 'search', params] as const,
      queryFn: () =>
        this.toPromise(
          this.get<AuditResponse[]>(
            `${this.endpoint}/search`,
            z.array(AuditResponseSchema),
            httpParams
          )
        ),
      staleTime: 1000 * 60 * 2, // 2 minutes
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
}
