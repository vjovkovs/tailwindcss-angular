import { Injectable } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { z } from 'zod';
import { AuditDetailsResponse, PaginatedResponse, PaginationParams } from '../models';
import { AuditDetailsResponseSchema, PaginatedResponseSchema } from '../schemas';
import { BaseApiService } from './base-api.service';

/**
 * Reference Audits Service (Read-Only NUPIC Data)
 *
 * Provides access to NUPIC audit reference data.
 * This is read-only data from the NUPIC system.
 *
 * For document manager audit CRUD operations, use AuditsService.
 */
@Injectable({
  providedIn: 'root',
})
export class ReferenceAuditsService extends BaseApiService {
  private readonly endpoint = '/api/ReferenceAudits';

  /**
   * Query for all NUPIC reference audits with pagination
   * Usage: audits = this.referenceAuditsService.getReferenceAuditsQuery(params);
   * Access data: audits.data(), audits.isLoading(), audits.error()
   */
  getReferenceAuditsQuery(params?: PaginationParams & { search?: string }) {
    const httpParams = this.buildParams(params);
    return injectQuery(() => ({
      queryKey: ['reference-audits', 'list', params] as const,
      queryFn: () =>
        this.toPromise(
          this.get<PaginatedResponse<AuditDetailsResponse>>(
            this.endpoint,
            PaginatedResponseSchema(AuditDetailsResponseSchema),
            httpParams
          )
        ),
      staleTime: 1000 * 60 * 5, // 5 minutes
    }));
  }

  /**
   * Query for a specific NUPIC audit by audit number
   * Usage: audit = this.referenceAuditsService.getAuditByNumberQuery(auditNumber);
   * Access data: audit.data(), audit.isLoading(), audit.error()
   */
  getAuditByNumberQuery(auditNumber: string | null) {
    return injectQuery(() => ({
      queryKey: ['reference-audits', 'detail', auditNumber] as const,
      queryFn: () =>
        this.toPromise(
          this.get<AuditDetailsResponse>(
            `${this.endpoint}/${auditNumber}`,
            AuditDetailsResponseSchema
          )
        ),
      enabled: !!auditNumber,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }));
  }

  /**
   * Query for NUPIC audits by supplier number
   * Usage: audits = this.referenceAuditsService.getAuditsBySupplierQuery(supplierNumber);
   * Access data: audits.data(), audits.isLoading(), audits.error()
   */
  getAuditsBySupplierQuery(supplierNumber: string | null) {
    return injectQuery(() => ({
      queryKey: ['reference-audits', 'supplier', supplierNumber] as const,
      queryFn: () =>
        this.toPromise(
          this.get<AuditDetailsResponse[]>(
            `${this.endpoint}/supplier/${supplierNumber}`,
            z.array(AuditDetailsResponseSchema)
          )
        ),
      enabled: !!supplierNumber,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }));
  }

  /**
   * Check if a NUPIC audit exists by audit number
   * Usage: exists = this.referenceAuditsService.auditExistsQuery(auditNumber);
   * Access data: exists.data(), exists.isLoading(), exists.error()
   */
  auditExistsQuery(auditNumber: string | null) {
    return injectQuery(() => ({
      queryKey: ['reference-audits', 'exists', auditNumber] as const,
      queryFn: async () => {
        if (!auditNumber) return false;
        try {
          await this.toPromise(
            this.get<boolean>(`${this.endpoint}/${auditNumber}/exists`, z.boolean())
          );
          return true;
        } catch {
          return false;
        }
      },
      enabled: !!auditNumber,
      staleTime: 1000 * 60 * 10, // 10 minutes (existence checks are stable)
    }));
  }
}
