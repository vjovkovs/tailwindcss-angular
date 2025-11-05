import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { z } from 'zod';
import {
  FileMetadataResponse,
  MergeFilesRequest,
  ReviewFileRequest,
  UpdateFileMetadataRequest,
} from '../models';
import {
  FileMetadataResponseSchema,
  MergeFilesRequestSchema,
  ReviewFileRequestSchema,
  UpdateFileMetadataRequestSchema,
} from '../schemas';
import { BaseApiService } from './base-api.service';

/**
 * Audit Files Service
 *
 * Provides file management operations for audits:
 * - Upload files to audits
 * - Get audit files
 * - Download files
 * - Update file metadata
 * - Delete files
 * - Review files
 * - Merge multiple files
 */
@Injectable({
  providedIn: 'root',
})
export class AuditFilesService extends BaseApiService {
  private readonly endpoint = '/api/AuditFiles';

  /**
   * Upload files to an audit
   */
  uploadAuditFiles(
    auditId: number,
    files: File[],
    phaseAssignmentId?: number,
    description?: string
  ): Observable<FileMetadataResponse[]> {
    const additionalData: Record<string, string | number> = {};
    if (phaseAssignmentId !== undefined) {
      additionalData['phaseAssignmentId'] = phaseAssignmentId;
    }
    if (description) {
      additionalData['description'] = description;
    }

    return super.uploadFiles(
      `${this.endpoint}/${auditId}/files`,
      files,
      z.array(FileMetadataResponseSchema),
      additionalData
    );
  }

  /**
   * Get all files for an audit
   */
  getAuditFiles(auditId: number): Observable<FileMetadataResponse[]> {
    return this.get(
      `${this.endpoint}/${auditId}/files`,
      z.array(FileMetadataResponseSchema)
    );
  }

  /**
   * Get files for a specific phase
   */
  getPhaseFiles(
    auditId: number,
    phaseAssignmentId: number
  ): Observable<FileMetadataResponse[]> {
    return this.get(
      `${this.endpoint}/${auditId}/phases/${phaseAssignmentId}/files`,
      z.array(FileMetadataResponseSchema)
    );
  }

  /**
   * Get file metadata by file ID
   */
  getFileMetadata(auditId: number, fileId: number): Observable<FileMetadataResponse> {
    return this.get(
      `${this.endpoint}/${auditId}/files/${fileId}`,
      FileMetadataResponseSchema
    );
  }

  /**
   * Update file metadata
   */
  updateFileMetadata(
    auditId: number,
    fileId: number,
    request: UpdateFileMetadataRequest
  ): Observable<FileMetadataResponse> {
    return this.put(
      `${this.endpoint}/${auditId}/files/${fileId}`,
      request,
      FileMetadataResponseSchema,
      UpdateFileMetadataRequestSchema
    );
  }

  /**
   * Delete a file
   */
  deleteFile(auditId: number, fileId: number): Observable<void> {
    return this.delete(`${this.endpoint}/${auditId}/files/${fileId}`);
  }

  /**
   * Download a file
   */
  downloadAuditFile(auditId: number, fileId: number): Observable<Blob> {
    return super.downloadFile(`${this.endpoint}/${auditId}/files/${fileId}/download`);
  }

  /**
   * Review a file
   */
  reviewFile(
    auditId: number,
    fileId: number,
    request: ReviewFileRequest
  ): Observable<void> {
    return this.post(
      `${this.endpoint}/${auditId}/files/${fileId}/review`,
      request,
      z.void(),
      ReviewFileRequestSchema
    );
  }

  /**
   * Merge multiple files
   */
  mergeFiles(request: MergeFilesRequest): Observable<FileMetadataResponse> {
    return this.post(
      `${this.endpoint}/merge`,
      request,
      FileMetadataResponseSchema,
      MergeFilesRequestSchema
    );
  }

  /**
   * Helper method to download file and trigger browser download
   */
  downloadFileAndSave(auditId: number, fileId: number, fileName?: string): Observable<void> {
    return new Observable((observer) => {
      this.downloadAuditFile(auditId, fileId).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName || `file-${fileId}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          observer.next();
          observer.complete();
        },
        error: (error) => observer.error(error),
      });
    });
  }
}
