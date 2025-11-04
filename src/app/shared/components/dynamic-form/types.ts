import { z } from 'zod';

/**
 * Supported field types for dynamic forms
 */
export type FieldType = 'text' | 'email' | 'number' | 'select' | 'checkbox' | 'textarea';

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
}
