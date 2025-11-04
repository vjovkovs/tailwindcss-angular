import { z } from 'zod';
import { FieldConfig, FieldType } from './types';

/**
 * Extracts field configurations from a Zod schema
 */
export function extractFieldsFromSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  customFields?: Partial<Record<keyof T, Partial<FieldConfig>>>
): FieldConfig[] {
  const shape = schema.shape;
  const fields: FieldConfig[] = [];

  for (const [name, zodType] of Object.entries(shape)) {
    const baseConfig = extractFieldConfig(name, zodType as z.ZodTypeAny);
    const customConfig = customFields?.[name as keyof T] || {};

    fields.push({
      ...baseConfig,
      ...customConfig,
    });
  }

  return fields;
}

/**
 * Extracts field configuration from a single Zod type
 */
function extractFieldConfig(name: string, zodType: z.ZodTypeAny): FieldConfig {
  const config: FieldConfig = {
    name,
    type: inferFieldType(zodType),
    label: formatLabel(name),
    required: !isOptional(zodType),
  };

  // Unwrap optional/nullable types
  let innerType = zodType;
  if (zodType instanceof z.ZodOptional || zodType instanceof z.ZodNullable) {
    innerType = zodType.unwrap();
  }

  // Extract validation constraints
  if (innerType instanceof z.ZodString) {
    const checks = (innerType as any)._def.checks || [];

    for (const check of checks) {
      if (check.kind === 'min') {
        config.minLength = check.value;
      }
      if (check.kind === 'max') {
        config.maxLength = check.value;
      }
    }
  }

  if (innerType instanceof z.ZodNumber) {
    const checks = (innerType as any)._def.checks || [];

    for (const check of checks) {
      if (check.kind === 'min') {
        config.min = check.value;
      }
      if (check.kind === 'max') {
        config.max = check.value;
      }
    }
  }

  // Extract enum options
  if (innerType instanceof z.ZodEnum) {
    config.options = (innerType as any)._def.values.map((value: string) => ({
      value,
      label: value,
    }));
  }

  // Extract default value
  if ((innerType as any)._def.defaultValue !== undefined) {
    config.defaultValue = (innerType as any)._def.defaultValue();
  }

  // Extract description from Zod description
  const description = (zodType as any)._def.description;
  if (description) {
    // Support format: "Label|hint" or just "Label"
    const parts = description.split('|');
    if (parts.length > 0) {
      config.label = parts[0];
    }
    if (parts.length > 1) {
      config.hint = parts[1];
    }
  }

  return config;
}

/**
 * Infers the field type from a Zod type
 */
function inferFieldType(zodType: z.ZodTypeAny): FieldType {
  // Unwrap optional/nullable types
  let innerType = zodType;
  if (zodType instanceof z.ZodOptional || zodType instanceof z.ZodNullable) {
    innerType = zodType.unwrap();
  }

  if (innerType instanceof z.ZodString) {
    const checks = (innerType as any)._def.checks || [];

    // Check for email validation
    if (checks.some((c: any) => c.kind === 'email')) {
      return 'email';
    }

    return 'text';
  }

  if (innerType instanceof z.ZodNumber) {
    return 'number';
  }

  if (innerType instanceof z.ZodBoolean) {
    return 'checkbox';
  }

  if (innerType instanceof z.ZodEnum) {
    return 'select';
  }

  // Default to text
  return 'text';
}

/**
 * Checks if a Zod type is optional
 */
function isOptional(zodType: z.ZodTypeAny): boolean {
  return zodType instanceof z.ZodOptional || zodType.isOptional();
}

/**
 * Formats a field name into a readable label
 * Example: "firstName" -> "First Name", "email" -> "Email"
 */
function formatLabel(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
}

/**
 * Creates a FormControl validator from a Zod type
 */
export function createZodValidator(zodType: z.ZodTypeAny) {
  return (control: any) => {
    const result = zodType.safeParse(control.value);
    if (result.success) {
      return null;
    }

    const errors: Record<string, string> = {};
    result.error.errors.forEach((err) => {
      errors[err.path.join('.') || 'value'] = err.message;
    });
    return errors;
  };
}
