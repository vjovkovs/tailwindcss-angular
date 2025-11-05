/**
 * NUPIC Document Manager API - Type Definitions
 * Generated from OpenAPI 3.0.0 specification
 *
 * Base URL: https://localhost:53928
 * API Version: v1
 */

// ============================================================================
// Core Domain Models - Audits
// ============================================================================

export interface AuditDetailsResponse {
  auditNumber: string;
  supplierNumber: string;
  supplierName: string;
  leadUtilityCode: string;
  auditTypeId: number;
  auditTypeName: string;
  fkPerNumb: number | null;
  contactPersonEmail: string;
  alternateContact: string;
  leadAuditor: string;
  startDate: string | null;
  endDate: string | null;
  auditApproved: boolean;
  approvedBy: string;
  dateNotified: string | null;
}

export interface AuditResponse {
  id: number;
  auditNumber: string;
  supplierNumber: string;
  leadUtilityCode: string;
  auditTypeId: number;
  auditTypeName: string;
  fkPerNumb: number | null;
  contactPersonEmail: string;
  alternateContact: string;
  startDate: string | null;
  endDate: string | null;
  auditApproved: boolean;
  approvedBy: string;
  dateNotified: string | null;
  createdDate: string;
  createdBy: string;
  updatedDate: string;
  updatedBy: string;
  leadAuditorName: string;
}

export interface CreateAuditRequest {
  auditNumber: string; // min: 5, max: 5
  supplierNumber: string; // min: 4, max: 4
  leadUtilityCode: string; // min: 3, max: 3
  auditTypeId: number;
  fkPerNumb: number | null;
  contactPersonEmail: string;
  alternateContact: string;
  startDate: string | null;
  endDate: string | null;
}

export interface UpdateAuditRequest {
  leadUtilityCode: string; // min: 3, max: 3
  fkPerNumb: number | null;
  contactPersonEmail: string;
  alternateContact: string;
  startDate: string | null;
  endDate: string | null;
  dateNotified: string;
  updatedBy: string;
}

export interface AuditTypeResponse {
  id: number;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

// ============================================================================
// Pagination
// ============================================================================

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
}

// ============================================================================
// Supplier Models
// ============================================================================

export interface SupplierDetailsResponse {
  supplierNumber: string;
  supplierName: string;
  city: string;
  state: string;
  contact: string;
  contactEmail: string;
  isActive: boolean;
  nupAudit: string;
  auditCount: number;
  hasContact: boolean;
  hasEmail: boolean;
  location: string;
}

// ============================================================================
// File Management Models
// ============================================================================

export interface FileMetadataResponse {
  fileId: number;
  fileName: string;
  fileExtension: string;
  contentType: string | null;
  fileSize: number;
  fileSizeFormatted: string;
  contentHash: string;
  sortOrder: number;
  notifiedDate: string;
  notifiedEmail: string;
  auditNumber: string;
  auditDocumentId: number;
  phaseAssignmentId: number;
  phaseName: string;
  createdDate: string;
  createdBy: string;
  updatedDate: string;
  updatedBy: string;
  isMerged: boolean;
}

export interface FileDownloadResponse {
  fileId: number;
  fileName: string;
  contentType: string;
  content: string; // base64
  fileSize: number;
  fileExtension: string;
  contentHash: string;
  eTag: string;
  lastModified: string | null;
  inline: boolean;
  metadata: Record<string, string>;
  fileSizeFormatted: string;
}

export interface UpdateFileMetadataRequest {
  fileName: string;
  sortOrder: number | null;
  notifiedDate: string;
  notifiedEmail: string;
  updatedBy: string | null;
}

export interface ReviewFileRequest {
  comments: string;
  sendNotification: boolean;
}

export interface MergeFilesRequest {
  targetFileId: number;
  sourceFileIds: number[];
  mergedFileName: string;
}

export interface UploadFilesRequest {
  phaseAssignmentId?: number;
  description?: string;
}

// ============================================================================
// Document Merge Models
// ============================================================================

export interface MergeAuditDocumentsRequest {
  auditId: number;
  documentIds: number[];
  templateId: number;
  outputFileName: string;
  applyBookmarks: boolean;
  includeTableOfContents: boolean;
}

export interface MergeTemplateResponse {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  bookmarkTemplateId: number | null;
  createdDate: string;
  createdBy: string;
}

export interface PreviewMergeRequest {
  auditId: number;
  documentIds: number[];
  templateId: number;
}

export interface PreviewMergeResponse {
  previewUrl: string;
  documentCount: number;
  estimatedSize: number;
  warnings: string[];
}

export interface ValidateMergeRequest {
  auditId: number;
  documentIds: number[];
  templateId: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ============================================================================
// Bookmark Models
// ============================================================================

export interface DocumentBookmarkResponse {
  id: number;
  fileMetadataId: number;
  auditDocumentId: number;
  bookmarkId: number;
  bookmarkKey: string;
  displayText: string;
  value: string;
  appliedFromTemplateId: number | null;
  templateName: string;
  createdDate: string;
  createdBy: string;
}

export interface CreateDocumentBookmarkRequest {
  fileMetadataId: number;
  bookmarkId: number;
  value: string;
}

export interface UpdateDocumentBookmarkRequest {
  value: string;
}

export interface BookmarkTemplateResponse {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  items: BookmarkTemplateItemResponse[];
}

export interface BookmarkTemplateItemResponse {
  id: number;
  bookmarkId: number;
  bookmarkKey: string;
  displayText: string;
  dataType: string;
  isRequired: boolean;
  sortOrder: number;
  overrideDefaultValue: string;
}

// ============================================================================
// Phase Management Models
// ============================================================================

export interface PhaseAssignmentResponse {
  id: number;
  auditId: number;
  phaseId: number;
  phaseName: string;
  phaseCode: string;
  status: string;
  isActive: boolean;
  startedDate: string | null;
  completedDate: string | null;
  completedBy: string;
  createdDate: string;
  createdBy: string;
}

export interface CompletePhaseRequest {
  comments: string;
  sendNotification: boolean;
}

export interface UpdatePhaseAssignmentRequest {
  status: string;
  isActive: boolean | null;
}

// ============================================================================
// Error Models
// ============================================================================

export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: any;
}

export interface ApiError {
  message: string;
  status: number;
  details?: ProblemDetails;
  originalError?: any;
}

// ============================================================================
// API Configuration
// ============================================================================

export interface NupicApiConfig {
  baseUrl: string;
  scope: string;
  clientId: string;
  tenantId: string;
}
