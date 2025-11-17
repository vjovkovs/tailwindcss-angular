/**
 * Supplier Data Transformer
 *
 * Handles custom transformation logic for supplier data from the API.
 *
 * NOTE: As of the latest API update, the backend now returns computed fields
 * (hasContact, hasEmail, location, auditCount) directly, so this transformer
 * is primarily for compatibility and any future client-side transformations.
 */

import type { SupplierDetailsResponse } from '@/core/api/generated';

/**
 * Extended supplier response with computed fields
 *
 * NOTE: These fields are now returned directly from the API, so this
 * interface is mainly for documentation and type compatibility.
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
 * Transform raw API supplier data to view model
 *
 * Since the API now returns computed fields, this mainly ensures
 * consistent typing and provides fallbacks for any missing data.
 *
 * @param data Raw supplier data from API
 * @returns Transformed supplier view model
 */
export function transformSupplierData(data: SupplierDetailsResponse): SupplierViewModel {
  return {
    ...data,

    // Use API-provided computed fields with fallbacks
    hasContact: data.hasContact ?? (!!data.contact && data.contact.trim().length > 0),
    hasEmail: data.hasEmail ?? (!!data.contactEmail && data.contactEmail.trim().length > 0),
    location: data.location ?? `${data.city || ''}, ${data.state || ''}`.trim(),
    auditCount: data.auditCount ?? 0,
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
