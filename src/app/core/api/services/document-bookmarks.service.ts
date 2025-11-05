import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { z } from 'zod';
import {
  BookmarkTemplateResponse,
  CreateDocumentBookmarkRequest,
  DocumentBookmarkResponse,
  UpdateDocumentBookmarkRequest,
} from '../models';
import {
  BookmarkTemplateResponseSchema,
  CreateDocumentBookmarkRequestSchema,
  DocumentBookmarkResponseSchema,
  UpdateDocumentBookmarkRequestSchema,
} from '../schemas';
import { BaseApiService } from './base-api.service';

/**
 * Document Bookmarks Service
 *
 * Provides bookmark management for audit documents:
 * - Get document bookmarks
 * - Create bookmarks
 * - Update bookmarks
 * - Delete bookmarks
 * - Apply bookmark templates
 * - Get bookmark templates
 */
@Injectable({
  providedIn: 'root',
})
export class DocumentBookmarksService extends BaseApiService {
  private readonly endpoint = '/api/DocumentBookmarks';

  /**
   * Get all bookmarks for a document
   */
  getDocumentBookmarks(auditDocumentId: number): Observable<DocumentBookmarkResponse[]> {
    return this.get(
      `${this.endpoint}/${auditDocumentId}`,
      z.array(DocumentBookmarkResponseSchema)
    );
  }

  /**
   * Create a new document bookmark
   */
  createDocumentBookmark(
    request: CreateDocumentBookmarkRequest
  ): Observable<DocumentBookmarkResponse> {
    return this.post(
      this.endpoint,
      request,
      DocumentBookmarkResponseSchema,
      CreateDocumentBookmarkRequestSchema
    );
  }

  /**
   * Update an existing bookmark
   */
  updateDocumentBookmark(
    id: number,
    request: UpdateDocumentBookmarkRequest
  ): Observable<DocumentBookmarkResponse> {
    return this.put(
      `${this.endpoint}/${id}`,
      request,
      DocumentBookmarkResponseSchema,
      UpdateDocumentBookmarkRequestSchema
    );
  }

  /**
   * Delete a bookmark
   */
  deleteDocumentBookmark(id: number): Observable<void> {
    return this.delete(`${this.endpoint}/${id}`);
  }

  /**
   * Apply a bookmark template to a document
   */
  applyBookmarkTemplate(
    auditDocumentId: number,
    templateId: number
  ): Observable<DocumentBookmarkResponse[]> {
    return this.post(
      `${this.endpoint}/${auditDocumentId}/apply-template/${templateId}`,
      {},
      z.array(DocumentBookmarkResponseSchema)
    );
  }

  /**
   * Get available bookmark templates
   */
  getBookmarkTemplates(): Observable<BookmarkTemplateResponse[]> {
    return this.get(
      `${this.endpoint}/templates`,
      z.array(BookmarkTemplateResponseSchema)
    );
  }
}
