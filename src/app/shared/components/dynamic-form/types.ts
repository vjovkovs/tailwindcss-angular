import { z } from 'zod';
import { TemplateRef } from '@angular/core';

/**
 * Supported field types for dynamic forms
 */
export type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'select'
  | 'searchable-select'
  | 'checkbox'
  | 'textarea'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'url'
  | 'tel'
  | 'password'
  | 'object'  // Nested object
  | 'array';  // Array of items

/**
 * Field configuration extracted from Zod schema
 */
export interface FieldConfig {
  name: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  hint?: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  defaultValue?: any;

  // Phase 2: Nested objects
  schema?: z.ZodObject<any>;
  fields?: FieldConfig[];

  // Phase 2: Arrays
  itemSchema?: z.ZodTypeAny;
  itemFields?: FieldConfig;
  minItems?: number;
  maxItems?: number;

  // Phase 2: Conditional visibility
  condition?: FieldCondition;

  // Phase 2: Custom rendering
  customTemplate?: TemplateRef<any>;

  // Phase 3: Grid layout
  colSpan?: number; // Number of columns to span in grid layout (1-12)
  rowSpan?: number; // Number of rows to span in grid layout

  // Phase 3: Field grouping
  group?: string; // Group identifier for field organization

  // Searchable select
  loading?: boolean; // Loading state for async options
  searchable?: boolean; // Enable search functionality
}

/**
 * Conditional visibility configuration
 */
export interface FieldCondition {
  /** Field name to watch */
  field: string;
  /** Operator for comparison */
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'truthy' | 'falsy';
  /** Value to compare against (optional for truthy/falsy) */
  value?: any;
}

/**
 * Phase 3: Field group configuration
 */
export interface FieldGroup {
  id: string;
  title: string;
  description?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  icon?: string;
}

/**
 * Phase 3: Multi-step form configuration
 */
export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: string[]; // Field names that belong to this step
  icon?: string;
  validate?: boolean; // Validate step before proceeding (default: true)
}

/**
 * Configuration for the dynamic form
 */
export interface DynamicFormConfig<T extends z.ZodRawShape> {
  schema: z.ZodObject<T>;
  fields?: Partial<Record<keyof T, Partial<FieldConfig>>>;
  submitLabel?: string;
  showCancel?: boolean;
  cancelLabel?: string;

  // Phase 2: Layout options
  layout?: 'vertical' | 'horizontal' | 'grid';
  columns?: number; // For grid layout (default: 2)

  // Phase 3: Field groups
  groups?: FieldGroup[];

  // Phase 3: Multi-step wizard
  steps?: FormStep[];
  showStepProgress?: boolean; // Show progress indicator (default: true)
}
