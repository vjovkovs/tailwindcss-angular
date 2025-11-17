/**
 * Supplier Data Transformer
 *
 * Handles custom transformation logic for supplier data from the API.
 * The API returns different field names than what the frontend expects,
 * and we compute additional derived fields.
 *
 * This preserves the custom logic from the manual schemas while using
 * the generated API types.
 */

import type { SupplierDetailsResponse } from '@/core/api/generated';

/**
 * Extended supplier response with computed fields
 */
export interface SupplierViewModel extends SupplierDetailsResponse {
  /** Whether the supplier has a contact person defined */
  hasContact: boolean;

  /** Whether the supplier has an email address */
  hasEmail: boolean;

  /** Formatted location string (City, State) */
  location: string;

  /** Number of audits for this supplier */
  auditCount: number;
}

/**
 * Transform raw API supplier data to view model with computed fields
 *
 * @param data Raw supplier data from API
 * @returns Transformed supplier view model
 */
export function transformSupplierData(data: SupplierDetailsResponse): SupplierViewModel {
  return {
    ...data,

    // Computed fields
    hasContact: !!data.contact && data.contact.trim().length > 0,
    hasEmail: !!data.contactEmail && data.contactEmail.trim().length > 0,
    location: `${data.city || ''}, ${data.state || ''}`.trim(),
    auditCount: data.audits?.length || 0,
  };
}

/**
 * Transform an array of supplier responses
 *
 * @param suppliers Array of supplier data from API
 * @returns Array of transformed supplier view models
 */
export function transformSuppliers(suppliers: SupplierDetailsResponse[]): SupplierViewModel[] {
  return suppliers.map(transformSupplierData);
}

/**
 * Validation helper: Check if supplier has complete contact information
 */
export function hasCompleteContactInfo(supplier: SupplierDetailsResponse | SupplierViewModel): boolean {
  const hasContact = !!supplier.contact && supplier.contact.trim().length > 0;
  const hasEmail = !!supplier.contactEmail && supplier.contactEmail.trim().length > 0;
  return hasContact && hasEmail;
}

/**
 * Format supplier display name
 */
export function formatSupplierDisplayName(supplier: SupplierDetailsResponse): string {
  return `${supplier.supplierNumber || ''} - ${supplier.supplierName || 'Unknown'}`.trim();
}
