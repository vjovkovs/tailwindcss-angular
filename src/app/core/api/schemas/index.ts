/**
 * NUPIC Document Manager API - Zod Validation Schemas
 * Generated from OpenAPI 3.0.0 specification
 *
 * Provides runtime type validation for API requests and responses
 */

import { z } from 'zod';

// ============================================================================
// Audit Schemas
// ============================================================================

export const AuditDetailsResponseSchema = z.object({
  auditNumber: z.string(),
  supplierNumber: z.string(),
  supplierName: z.string(),
  leadUtilityCode: z.string(),
  auditTypeId: z.number().int(),
  auditTypeName: z.string(),
  fkPerNumb: z.number().int().nullable(),
  contactPersonEmail: z.string().email(),
  alternateContact: z.string().email(),
  leadAuditor: z.string(),
  startDate: z.string().datetime().nullable(),
  endDate: z.string().datetime().nullable(),
  auditApproved: z.boolean(),
  approvedBy: z.string(),
  dateNotified: z.string().datetime().nullable(),
});

export const AuditResponseSchema = z.object({
  id: z.number().int(),
  auditNumber: z.string(),
  supplierNumber: z.string(),
  leadUtilityCode: z.string(),
  auditTypeId: z.number().int(),
  auditTypeName: z.string(),
  fkPerNumb: z.number().int().nullable(),
  contactPersonEmail: z.string().email(),
  alternateContact: z.string().email(),
  startDate: z.string().datetime().nullable(),
  endDate: z.string().datetime().nullable(),
  auditApproved: z.boolean(),
  approvedBy: z.string(),
  dateNotified: z.string().datetime().nullable(),
  createdDate: z.string().datetime(),
  createdBy: z.string(),
  updatedDate: z.string().datetime(),
  updatedBy: z.string(),
  leadAuditorName: z.string(),
});

export const CreateAuditRequestSchema = z.object({
  auditNumber: z.string().length(5, 'Audit number must be exactly 5 characters'),
  supplierNumber: z.string().length(4, 'Supplier number must be exactly 4 characters'),
  leadUtilityCode: z.string().length(3, 'Lead utility code must be exactly 3 characters'),
  auditTypeId: z.number().int().positive(),
  fkPerNumb: z.number().int().nullable(),
  contactPersonEmail: z.string().email('Invalid email format'),
  alternateContact: z.string().email('Invalid email format'),
  startDate: z.string().datetime().nullable(),
  endDate: z.string().datetime().nullable(),
});

export const UpdateAuditRequestSchema = z.object({
  leadUtilityCode: z.string().length(3, 'Lead utility code must be exactly 3 characters'),
  fkPerNumb: z.number().int().nullable(),
  contactPersonEmail: z.string().email('Invalid email format'),
  alternateContact: z.string().email('Invalid email format'),
  startDate: z.string().datetime().nullable(),
  endDate: z.string().datetime().nullable(),
  dateNotified: z.string().datetime(),
  updatedBy: z.string().min(1, 'Updated by is required'),
});

export const AuditTypeResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  code: z.string(),
  description: z.string(),
  isActive: z.boolean(),
});

// ============================================================================
// Pagination Schema
// ============================================================================

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    totalCount: z.number().int().nonnegative(),
    pageNumber: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
    hasPreviousPage: z.boolean(),
    hasNextPage: z.boolean(),
  });

export const PaginationParamsSchema = z.object({
  pageNumber: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
  search: z.string().optional(),
});

// ============================================================================
// Supplier Schemas
// ============================================================================

// Helper to transform raw API supplier data to TypeScript interface
const transformSupplierData = (data: any) => ({
  supplierNumber: data.suppNumb,
  supplierName: data.suppName,
  city: data.city,
  state: data.state,
  contact: data.contact || '',
  contactEmail: data.contactEmail || '',
  isActive: data.activeInactive,
  nupAudit: data.nupAudit || '',
  auditCount: data.audits?.length || 0,
  hasContact: !!data.contact && data.contact.trim().length > 0,
  hasEmail: !!data.contactEmail && data.contactEmail.trim().length > 0,
  location: `${data.city}, ${data.state}`,
});

// Raw API response schema matching actual backend field names
const SupplierDetailsApiResponseSchema = z.object({
  suppNumb: z.string(),
  suppName: z.string(),
  city: z.string(),
  state: z.string(),
  contact: z.string().nullable(),
  contactEmail: z.string().nullable(),
  nupAudit: z.string().nullable(),
  activeInactive: z.boolean(),
  audits: z.array(z.any()),
});

// Schema for single supplier with transformation
export const SupplierDetailsResponseSchema = SupplierDetailsApiResponseSchema.transform(transformSupplierData);

// Schema for paginated supplier response with transformation
export const PaginatedSupplierResponseSchema = PaginatedResponseSchema(SupplierDetailsApiResponseSchema)
  .transform((data) => ({
    ...data,
    items: data.items.map(transformSupplierData),
  }));

// ============================================================================
// File Management Schemas
// ============================================================================

export const FileMetadataResponseSchema = z.object({
  fileId: z.number().int(),
  fileName: z.string(),
  fileExtension: z.string(),
  contentType: z.string().nullable(),
  fileSize: z.number().nonnegative(),
  fileSizeFormatted: z.string(),
  contentHash: z.string(),
  sortOrder: z.number().int(),
  notifiedDate: z.string().datetime(),
  notifiedEmail: z.string().email(),
  auditNumber: z.string(),
  auditDocumentId: z.number().int(),
  phaseAssignmentId: z.number().int(),
  phaseName: z.string(),
  createdDate: z.string().datetime(),
  createdBy: z.string(),
  updatedDate: z.string().datetime(),
  updatedBy: z.string(),
  isMerged: z.boolean(),
});

export const FileDownloadResponseSchema = z.object({
  fileId: z.number().int(),
  fileName: z.string(),
  contentType: z.string(),
  content: z.string(), // base64
  fileSize: z.number().nonnegative(),
  fileExtension: z.string(),
  contentHash: z.string(),
  eTag: z.string(),
  lastModified: z.string().datetime().nullable(),
  inline: z.boolean(),
  metadata: z.record(z.string()),
  fileSizeFormatted: z.string(),
});

export const UpdateFileMetadataRequestSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  sortOrder: z.number().int().nullable(),
  notifiedDate: z.string().datetime(),
  notifiedEmail: z.string().email('Invalid email format'),
  updatedBy: z.string().nullable(),
});

export const ReviewFileRequestSchema = z.object({
  comments: z.string().min(1, 'Comments are required'),
  sendNotification: z.boolean(),
});

export const MergeFilesRequestSchema = z.object({
  targetFileId: z.number().int().positive(),
  sourceFileIds: z.array(z.number().int().positive()).min(1, 'At least one source file is required'),
  mergedFileName: z.string().min(1, 'Merged file name is required'),
});

// ============================================================================
// Document Merge Schemas
// ============================================================================

export const MergeAuditDocumentsRequestSchema = z.object({
  auditId: z.number().int().positive(),
  documentIds: z.array(z.number().int().positive()).min(1, 'At least one document is required'),
  templateId: z.number().int().positive(),
  outputFileName: z.string().min(1, 'Output file name is required'),
  applyBookmarks: z.boolean(),
  includeTableOfContents: z.boolean(),
});

export const MergeTemplateResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  bookmarkTemplateId: z.number().int().nullable(),
  createdDate: z.string().datetime(),
  createdBy: z.string(),
});

export const PreviewMergeRequestSchema = z.object({
  auditId: z.number().int().positive(),
  documentIds: z.array(z.number().int().positive()).min(1),
  templateId: z.number().int().positive(),
});

export const ValidateMergeRequestSchema = z.object({
  auditId: z.number().int().positive(),
  documentIds: z.array(z.number().int().positive()).min(1),
  templateId: z.number().int().positive(),
});

// ============================================================================
// Bookmark Schemas
// ============================================================================

export const DocumentBookmarkResponseSchema = z.object({
  id: z.number().int(),
  fileMetadataId: z.number().int(),
  auditDocumentId: z.number().int(),
  bookmarkId: z.number().int(),
  bookmarkKey: z.string(),
  displayText: z.string(),
  value: z.string(),
  appliedFromTemplateId: z.number().int().nullable(),
  templateName: z.string(),
  createdDate: z.string().datetime(),
  createdBy: z.string(),
});

export const CreateDocumentBookmarkRequestSchema = z.object({
  fileMetadataId: z.number().int().positive(),
  bookmarkId: z.number().int().positive(),
  value: z.string().min(1, 'Value is required'),
});

export const UpdateDocumentBookmarkRequestSchema = z.object({
  value: z.string().min(1, 'Value is required'),
});

export const BookmarkTemplateItemResponseSchema = z.object({
  id: z.number().int(),
  bookmarkId: z.number().int(),
  bookmarkKey: z.string(),
  displayText: z.string(),
  dataType: z.string(),
  isRequired: z.boolean(),
  sortOrder: z.number().int(),
  overrideDefaultValue: z.string(),
});

export const BookmarkTemplateResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  items: z.array(BookmarkTemplateItemResponseSchema),
});

// ============================================================================
// Phase Management Schemas
// ============================================================================

export const PhaseAssignmentResponseSchema = z.object({
  id: z.number().int(),
  auditId: z.number().int(),
  phaseId: z.number().int(),
  phaseName: z.string(),
  phaseCode: z.string(),
  status: z.string(),
  isActive: z.boolean(),
  startedDate: z.string().datetime().nullable(),
  completedDate: z.string().datetime().nullable(),
  completedBy: z.string(),
  createdDate: z.string().datetime(),
  createdBy: z.string(),
});

export const CompletePhaseRequestSchema = z.object({
  comments: z.string().min(1, 'Comments are required'),
  sendNotification: z.boolean(),
});

export const UpdatePhaseAssignmentRequestSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  isActive: z.boolean().nullable(),
});

// ============================================================================
// Error Schemas
// ============================================================================

export const ProblemDetailsSchema = z.object({
  type: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  status: z.number().int().nullable().optional(),
  detail: z.string().nullable().optional(),
  instance: z.string().nullable().optional(),
}).catchall(z.any());

// ============================================================================
// Type Inference Helpers
// ============================================================================

export type AuditDetailsResponse = z.infer<typeof AuditDetailsResponseSchema>;
export type AuditResponse = z.infer<typeof AuditResponseSchema>;
export type CreateAuditRequest = z.infer<typeof CreateAuditRequestSchema>;
export type UpdateAuditRequest = z.infer<typeof UpdateAuditRequestSchema>;
export type AuditTypeResponse = z.infer<typeof AuditTypeResponseSchema>;
export type SupplierDetailsResponse = z.infer<typeof SupplierDetailsResponseSchema>;
export type FileMetadataResponse = z.infer<typeof FileMetadataResponseSchema>;
export type FileDownloadResponse = z.infer<typeof FileDownloadResponseSchema>;
export type UpdateFileMetadataRequest = z.infer<typeof UpdateFileMetadataRequestSchema>;
export type ReviewFileRequest = z.infer<typeof ReviewFileRequestSchema>;
export type MergeFilesRequest = z.infer<typeof MergeFilesRequestSchema>;
export type MergeAuditDocumentsRequest = z.infer<typeof MergeAuditDocumentsRequestSchema>;
export type MergeTemplateResponse = z.infer<typeof MergeTemplateResponseSchema>;
export type DocumentBookmarkResponse = z.infer<typeof DocumentBookmarkResponseSchema>;
export type CreateDocumentBookmarkRequest = z.infer<typeof CreateDocumentBookmarkRequestSchema>;
export type UpdateDocumentBookmarkRequest = z.infer<typeof UpdateDocumentBookmarkRequestSchema>;
export type BookmarkTemplateResponse = z.infer<typeof BookmarkTemplateResponseSchema>;
export type BookmarkTemplateItemResponse = z.infer<typeof BookmarkTemplateItemResponseSchema>;
export type PhaseAssignmentResponse = z.infer<typeof PhaseAssignmentResponseSchema>;
export type CompletePhaseRequest = z.infer<typeof CompletePhaseRequestSchema>;
export type UpdatePhaseAssignmentRequest = z.infer<typeof UpdatePhaseAssignmentRequestSchema>;
export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;
