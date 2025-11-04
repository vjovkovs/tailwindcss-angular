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

  // Phase 2: Handle nested objects
  if (innerType instanceof z.ZodObject) {
    config.schema = innerType;
    config.fields = extractFieldsFromSchema(innerType, {});
  }

  // Phase 2: Handle arrays
  if (innerType instanceof z.ZodArray) {
    const itemType = (innerType as any)._def.type;
    config.itemSchema = itemType;

    // If array items are objects, extract their field configs
    if (itemType instanceof z.ZodObject) {
      config.itemFields = {
        name: 'item',
        type: 'object',
        label: 'Item',
        required: true,
        schema: itemType,
        fields: extractFieldsFromSchema(itemType, {}),
      };
    } else {
      // For primitive arrays, create a simple field config
      config.itemFields = {
        name: 'item',
        type: inferFieldType(itemType),
        label: 'Item',
        required: true,
      };
    }

    // Extract array constraints
    const checks = (innerType as any)._def._def?.minLength || (innerType as any)._def._def?.maxLength;
    if ((innerType as any)._def.minLength) {
      config.minItems = (innerType as any)._def.minLength.value;
    }
    if ((innerType as any)._def.maxLength) {
      config.maxItems = (innerType as any)._def.maxLength.value;
    }
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

  // Phase 2: Check for nested objects
  if (innerType instanceof z.ZodObject) {
    return 'object';
  }

  // Phase 2: Check for arrays
  if (innerType instanceof z.ZodArray) {
    return 'array';
  }

  if (innerType instanceof z.ZodString) {
    const checks = (innerType as any)._def.checks || [];

    // Check for specific string formats
    if (checks.some((c: any) => c.kind === 'email')) {
      return 'email';
    }
    if (checks.some((c: any) => c.kind === 'url')) {
      return 'url';
    }
    if (checks.some((c: any) => c.kind === 'datetime')) {
      return 'datetime-local';
    }

    // Check description for field type hints
    const description = (zodType as any)._def.description || '';
    if (description.toLowerCase().includes('password')) {
      return 'password';
    }
    if (description.toLowerCase().includes('phone') || description.toLowerCase().includes('tel')) {
      return 'tel';
    }
    if (description.toLowerCase().includes('date')) {
      return 'date';
    }
    if (description.toLowerCase().includes('time')) {
      return 'time';
    }
    if (description.toLowerCase().includes('textarea') || description.toLowerCase().includes('multiline')) {
      return 'textarea';
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

  if (innerType instanceof z.ZodDate) {
    return 'date';
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

/**
 * Evaluates a field condition against form values
 * Phase 2: Conditional field visibility
 */
export function evaluateCondition(
  condition: { field: string; operator: string; value?: any } | undefined,
  formValues: Record<string, any>
): boolean {
  if (!condition) {
    return true; // No condition means always visible
  }

  const fieldValue = formValues[condition.field];

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;

    case 'notEquals':
      return fieldValue !== condition.value;

    case 'contains':
      if (typeof fieldValue === 'string') {
        return fieldValue.includes(condition.value);
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(condition.value);
      }
      return false;

    case 'greaterThan':
      return fieldValue > condition.value;

    case 'lessThan':
      return fieldValue < condition.value;

    case 'truthy':
      return !!fieldValue;

    case 'falsy':
      return !fieldValue;

    default:
      return true;
  }
}
