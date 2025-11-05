import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { z } from 'zod';
import {
  CompletePhaseRequest,
  PhaseAssignmentResponse,
  UpdatePhaseAssignmentRequest,
} from '../models';
import {
  CompletePhaseRequestSchema,
  PhaseAssignmentResponseSchema,
  UpdatePhaseAssignmentRequestSchema,
} from '../schemas';
import { BaseApiService } from './base-api.service';

/**
 * Phase Assignments Service
 *
 * Provides phase management operations for audits:
 * - Get phase assignments
 * - Complete phases
 * - Update phase assignments
 */
@Injectable({
  providedIn: 'root',
})
export class PhaseAssignmentsService extends BaseApiService {
  private readonly endpoint = '/api/PhaseAssignments';

  /**
   * Get all phase assignments for an audit
   */
  getPhaseAssignments(auditId: number): Observable<PhaseAssignmentResponse[]> {
    return this.get(
      `${this.endpoint}/${auditId}`,
      z.array(PhaseAssignmentResponseSchema)
    );
  }

  /**
   * Complete a phase
   */
  completePhase(
    auditId: number,
    phaseAssignmentId: number,
    request: CompletePhaseRequest
  ): Observable<void> {
    return this.post(
      `${this.endpoint}/${auditId}/phases/${phaseAssignmentId}/complete`,
      request,
      z.void(),
      CompletePhaseRequestSchema
    );
  }

  /**
   * Update a phase assignment
   */
  updatePhaseAssignment(
    auditId: number,
    phaseAssignmentId: number,
    request: UpdatePhaseAssignmentRequest
  ): Observable<PhaseAssignmentResponse> {
    return this.put(
      `${this.endpoint}/${auditId}/phases/${phaseAssignmentId}`,
      request,
      PhaseAssignmentResponseSchema,
      UpdatePhaseAssignmentRequestSchema
    );
  }
}
