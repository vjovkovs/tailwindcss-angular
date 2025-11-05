import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { z } from 'zod';
import { AuditDetailsResponse } from '../models';
import { AuditDetailsResponseSchema } from '../schemas';
import { BaseApiService } from './base-api.service';

/**
 * NUPIC Audits Service (Read-Only)
 *
 * Provides read-only access to NUPIC audit data:
 * - Get all NUPIC audits
 * - Get specific audit by number
 * - Check if audit exists
 * - Get audits by supplier
 */
@Injectable({
  providedIn: 'root',
})
export class NupicAuditsService extends BaseApiService {
  private readonly endpoint = '/api/NupicAudits';

  /**
   * Get all NUPIC audits
   */
  getAllNupicAudits(): Observable<AuditDetailsResponse[]> {
    return this.get(
      `${this.endpoint}/GetAllNupicAudits`,
      z.array(AuditDetailsResponseSchema)
    );
  }

  /**
   * Get NUPIC audit by audit number
   */
  getNupicAuditByNumber(auditNumber: string): Observable<AuditDetailsResponse> {
    return this.get(`${this.endpoint}/${auditNumber}`, AuditDetailsResponseSchema);
  }

  /**
   * Check if NUPIC audit exists (using HEAD request)
   */
  nupicAuditExists(auditNumber: string): Observable<boolean> {
    return this.head(`${this.endpoint}/${auditNumber}`);
  }

  /**
   * Check if NUPIC audit exists (using GET request)
   */
  nupicAuditExistsGet(auditNumber: string): Observable<boolean> {
    return this.get(`${this.endpoint}/${auditNumber}/exists`, z.boolean());
  }

  /**
   * Get NUPIC audits by supplier number
   */
  getNupicAuditsBySupplier(supplierNumber: string): Observable<AuditDetailsResponse[]> {
    return this.get(
      `${this.endpoint}/supplier/${supplierNumber}`,
      z.array(AuditDetailsResponseSchema)
    );
  }
}
