import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
 * Audits Service
 *
 * Provides full CRUD operations for managing audits:
 * - Create, read, update, delete audits
 * - Search and filter audits
 * - Get audits by supplier
 * - Approve audits
 * - Get audit types
 */
@Injectable({
  providedIn: 'root',
})
export class AuditsService extends BaseApiService {
  private readonly endpoint = '/api/Audits';

  /**
   * Get all audits with pagination and search
   */
  getAllAudits(params?: PaginationParams): Observable<PaginatedResponse<AuditResponse>> {
    const httpParams = this.buildParams(params);
    return this.get(
      `${this.endpoint}/GetAll`,
      PaginatedResponseSchema(AuditResponseSchema),
      httpParams
    );
  }

  /**
   * Create a new audit
   */
  createAudit(request: CreateAuditRequest): Observable<AuditResponse> {
    return this.post(
      this.endpoint,
      request,
      AuditResponseSchema,
      CreateAuditRequestSchema
    );
  }

  /**
   * Get audit by ID
   */
  getAuditById(id: number): Observable<AuditResponse> {
    return this.get(`${this.endpoint}/${id}`, AuditResponseSchema);
  }

  /**
   * Update an existing audit
   */
  updateAudit(id: number, request: UpdateAuditRequest): Observable<AuditResponse> {
    return this.put(
      `${this.endpoint}/${id}`,
      request,
      AuditResponseSchema,
      UpdateAuditRequestSchema
    );
  }

  /**
   * Delete an audit
   */
  deleteAudit(id: number): Observable<void> {
    return this.delete(`${this.endpoint}/${id}`);
  }

  /**
   * Get audit by audit number
   */
  getAuditByNumber(auditNumber: string): Observable<AuditResponse> {
    return this.get(`${this.endpoint}/number/${auditNumber}`, AuditResponseSchema);
  }

  /**
   * Get audits by supplier number
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
   * Approve an audit
   */
  approveAudit(id: number): Observable<AuditResponse> {
    return this.post(`${this.endpoint}/${id}/approve`, {}, AuditResponseSchema);
  }

  /**
   * Get available audit types
   */
  getAuditTypes(): Observable<AuditTypeResponse[]> {
    return this.get(`${this.endpoint}/types`, z.array(AuditTypeResponseSchema));
  }
}
