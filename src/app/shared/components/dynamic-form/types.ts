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
  columns?: number; // For grid layout
}
