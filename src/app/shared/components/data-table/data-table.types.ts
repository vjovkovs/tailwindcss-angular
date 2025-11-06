/**
 * Data Table Types and Interfaces
 *
 * Defines the types for configurable table columns, sorting, filtering, and actions
 */

import { TemplateRef } from '@angular/core';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc' | null;

/**
 * Filter operator
 */
export type FilterOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';

/**
 * Filter configuration
 */
export interface TableFilter<T = any> {
  field: keyof T;
  operator: FilterOperator;
  value: any;
}

/**
 * Sort configuration
 */
export interface TableSort<T = any> {
  field: keyof T;
  direction: SortDirection;
}

/**
 * Column definition
 */
export interface TableColumn<T = any> {
  /** Column header label */
  label: string;

  /** Field name in the data object */
  field: keyof T;

  /** Whether this column is sortable */
  sortable?: boolean;

  /** Whether this column is filterable */
  filterable?: boolean;

  /** Custom cell template */
  cellTemplate?: TemplateRef<any>;

  /** Custom formatting function */
  format?: (value: any, row: T) => string;

  /** CSS class for column */
  columnClass?: string;

  /** CSS class for header */
  headerClass?: string;

  /** Column width */
  width?: string;

  /** Whether column is visible */
  visible?: boolean;
}

/**
 * Action button configuration
 */
export interface TableAction<T = any> {
  /** Action label/tooltip */
  label: string;

  /** Icon class (e.g., heroicon classes) */
  icon?: string;

  /** Action handler */
  handler: (row: T) => void;

  /** Whether action is visible for this row */
  visible?: (row: T) => boolean;

  /** Whether action is disabled for this row */
  disabled?: (row: T) => boolean;

  /** CSS class for action button */
  buttonClass?: string;
}

/**
 * Table configuration
 */
export interface TableConfig<T = any> {
  /** Column definitions */
  columns: TableColumn<T>[];

  /** Row actions */
  actions?: TableAction<T>[];

  /** Enable search */
  searchable?: boolean;

  /** Search placeholder text */
  searchPlaceholder?: string;

  /** Enable pagination */
  pageable?: boolean;

  /** Page size options */
  pageSizeOptions?: number[];

  /** Default page size */
  defaultPageSize?: number;

  /** Enable row selection */
  selectable?: boolean;

  /** Enable multi-row selection */
  multiSelect?: boolean;

  /** Show row numbers */
  showRowNumbers?: boolean;

  /** Empty state message */
  emptyStateMessage?: string;

  /** Loading state message */
  loadingMessage?: string;

  /** CSS class for table */
  tableClass?: string;

  /** Row click handler */
  onRowClick?: (row: T) => void;

  /** New item handler (creates redirect button) */
  onNew?: () => void;

  /** New button label */
  newButtonLabel?: string;
}

/**
 * Pagination state
 */
export interface PaginationState {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Table state
 */
export interface TableState<T = any> {
  data: T[];
  filteredData: T[];
  paginatedData: T[];
  searchTerm: string;
  filters: TableFilter<T>[];
  sort: TableSort<T> | null;
  pagination: PaginationState;
  selectedRows: T[];
  loading: boolean;
}
