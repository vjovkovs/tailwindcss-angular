/**
 * OpenAPI Spec Parser
 *
 * Automatically extracts entity metadata from OpenAPI specification
 * Eliminates need for manual entity configurations
 */

import fs from 'fs';
import path from 'path';

/**
 * Entity metadata extracted from OpenAPI spec
 *
 * @typedef {Object} EntityMetadata
 * @property {string} name - Entity name (e.g., "Personnel")
 * @property {string} pluralName - Plural form (e.g., "Personnel")
 * @property {string} endpoint - Base endpoint (e.g., "ReferencePersonnel")
 * @property {SchemaInfo} schema - Schema information
 * @property {EntityOperations} operations - CRUD operations
 * @property {ColumnInfo[]} columns - Table columns
 * @property {PreviewFieldInfo[]} previewFields - Preview fields
 * @property {string} idField - Primary key field
 * @property {RelationshipInfo[]} relationships - Foreign key relationships
 */

/**
 * Parse OpenAPI specification and extract entity metadata
 */
export function parseOpenAPISpec(specPath) {
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  const entities = [];

  // Group paths by entity
  const entityPaths = groupPathsByEntity(spec.paths);

  for (const [entityName, paths] of Object.entries(entityPaths)) {
    const metadata = extractEntityMetadata(entityName, paths, spec);
    if (metadata) {
      entities.push(metadata);
    }
  }

  return entities;
}

/**
 * Group API paths by entity name
 */
function groupPathsByEntity(paths) {
  const grouped = new Map();

  for (const [path, pathItem] of Object.entries(paths)) {
    // Extract entity from path: /api/ReferencePersonnel -> ReferencePersonnel
    const match = path.match(/^\/api\/([^\/]+)/);
    if (!match) continue;

    const entityName = match[1];
    if (!grouped.has(entityName)) {
      grouped.set(entityName, []);
    }

    grouped.get(entityName).push({ path, ...pathItem });
  }

  return grouped;
}

/**
 * Extract metadata for a single entity
 */
function extractEntityMetadata(entityName, paths, spec) {
  // Find operations
  const operations = extractOperations(entityName, paths);

  if (!operations.list && !operations.get) {
    // Not a valid CRUD entity
    return null;
  }

  // Get response schema
  const responseSchemaName = getResponseSchemaName(operations.list || operations.get, spec);
  if (!responseSchemaName) return null;

  // Extract schema info
  const schema = extractSchemaInfo(responseSchemaName, spec);
  if (!schema) return null;

  // Generate columns from schema
  const columns = generateColumns(schema);

  // Generate preview fields
  const previewFields = generatePreviewFields(schema);

  // Find ID field
  const idField = findIdField(schema);

  // Detect relationships
  const relationships = detectRelationships(schema, spec);

  // Clean entity name (remove "Reference" prefix if present)
  const cleanName = entityName.replace(/^Reference/, '');

  return {
    name: cleanName,
    pluralName: pluralize(cleanName),
    endpoint: entityName,
    schema,
    operations,
    columns,
    previewFields,
    idField,
    relationships,
  };
}

/**
 * Extract CRUD operations from paths
 */
function extractOperations(entityName, paths) {
  const operations = {};

  for (const pathItem of paths) {
    const { path, ...methods } = pathItem;

    // List operation: GET /api/Entity (no path params)
    if (methods.get && !path.includes('{')) {
      const op = methods.get;
      operations.list = {
        operationId: op.operationId,
        path,
        method: 'get',
        functionName: extractFunctionName(op.operationId),
        responseSchema: extractResponseSchema(op),
        parameters: extractParameters(op),
      };
    }

    // Get by ID: GET /api/Entity/{id}
    if (methods.get && path.includes('{')) {
      const op = methods.get;
      operations.get = {
        operationId: op.operationId,
        path,
        method: 'get',
        functionName: extractFunctionName(op.operationId),
        responseSchema: extractResponseSchema(op),
        parameters: extractParameters(op),
      };
    }

    // Create: POST /api/Entity
    if (methods.post) {
      const op = methods.post;
      operations.create = {
        operationId: op.operationId,
        path,
        method: 'post',
        functionName: extractFunctionName(op.operationId),
        requestSchema: extractRequestSchema(op),
        responseSchema: extractResponseSchema(op),
        parameters: extractParameters(op),
      };
    }

    // Update: PUT /api/Entity/{id}
    if (methods.put) {
      const op = methods.put;
      operations.update = {
        operationId: op.operationId,
        path,
        method: 'put',
        functionName: extractFunctionName(op.operationId),
        requestSchema: extractRequestSchema(op),
        responseSchema: extractResponseSchema(op),
        parameters: extractParameters(op),
      };
    }

    // Delete: DELETE /api/Entity/{id}
    if (methods.delete) {
      const op = methods.delete;
      operations.delete = {
        operationId: op.operationId,
        path,
        method: 'delete',
        functionName: extractFunctionName(op.operationId),
        responseSchema: extractResponseSchema(op),
        parameters: extractParameters(op),
      };
    }
  }

  return operations;
}

/**
 * Extract function name from operation ID
 * operationId: "ReferencePersonnel_GetPersonnel" -> "referencePersonnelGetPersonnel"
 */
function extractFunctionName(operationId) {
  return operationId
    .replace(/_/g, '')
    .replace(/^./, (c) => c.toLowerCase());
}

/**
 * Get response schema name from operation
 */
function getResponseSchemaName(operation, spec) {
  // Look for response schema in the spec
  const opDef = findOperationInSpec(operation.operationId, spec);
  if (!opDef) return null;

  const response200 = opDef.responses?.['200'];
  if (!response200) return null;

  const schema = response200.content?.['application/json']?.schema;
  if (!schema) return null;

  // Handle $ref
  if (schema.$ref) {
    return schema.$ref.split('/').pop();
  }

  // Handle inline schema with items (for paginated responses)
  if (schema.properties?.items?.items?.$ref) {
    return schema.properties.items.items.$ref.split('/').pop();
  }

  return null;
}

/**
 * Find operation definition in spec
 */
function findOperationInSpec(operationId, spec) {
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (operation.operationId === operationId) {
        return operation;
      }
    }
  }
  return null;
}

/**
 * Extract schema information
 */
function extractSchemaInfo(schemaName, spec) {
  const schema = spec.components?.schemas?.[schemaName];
  if (!schema) return null;

  const properties = [];

  for (const [propName, propDef] of Object.entries(schema.properties || {})) {
    const prop = propDef;
    properties.push({
      name: propName,
      type: getTypeFromSchema(prop),
      format: prop.format,
      nullable: prop.nullable || false,
      description: prop.description,
      enum: prop.enum,
    });
  }

  return {
    name: schemaName,
    properties,
    required: schema.required || [],
  };
}

/**
 * Get TypeScript type from schema property
 */
function getTypeFromSchema(prop) {
  if (prop.type === 'integer') return 'number';
  if (prop.type === 'string' && prop.format === 'date-time') return 'Date';
  if (prop.type === 'array') return 'Array';
  return prop.type || 'string';
}

/**
 * Generate table columns from schema
 */
function generateColumns(schema) {
  const columns = [];
  const maxColumns = 8; // Limit columns for readability

  // Priority fields for display
  const priorityFields = ['id', 'number', 'name', 'email', 'status', 'isActive', 'createdDate'];

  // Sort properties by priority
  const sorted = schema.properties.sort((a, b) => {
    const aPriority = priorityFields.findIndex(pf => a.name.toLowerCase().includes(pf.toLowerCase()));
    const bPriority = priorityFields.findIndex(pf => b.name.toLowerCase().includes(pf.toLowerCase()));

    if (aPriority === -1 && bPriority === -1) return 0;
    if (aPriority === -1) return 1;
    if (bPriority === -1) return -1;
    return aPriority - bPriority;
  });

  // Take top priority fields
  for (const prop of sorted.slice(0, maxColumns)) {
    // Skip internal fields
    if (prop.name.match(/^(created|updated)(By|Date)$/i)) continue;

    const column = {
      label: formatLabel(prop.name),
      field: prop.name,
      sortable: true,
    };

    // Add formatting for specific types
    if (prop.type === 'boolean') {
      column.format = '(value) => (value ? "Yes" : "No")';
      column.columnClass = 'px-6 py-4 text-sm text-center';
      column.width = '80px';
    } else if (prop.type === 'Date') {
      column.format = '(value) => value ? new Date(value).toLocaleDateString() : "N/A"';
    } else if (prop.name.toLowerCase().includes('number') || prop.name.toLowerCase().includes('id')) {
      column.width = '120px';
    }

    columns.push(column);
  }

  return columns;
}

/**
 * Generate preview fields from schema
 */
function generatePreviewFields(schema) {
  return schema.properties.map(prop => {
    const field = {
      label: formatLabel(prop.name),
      field: prop.name,
    };

    // Add formatting for specific types
    if (prop.type === 'boolean') {
      field.format = '(v) => (v ? "Yes" : "No")';
    } else if (prop.type === 'Date') {
      field.format = '(v) => v ? new Date(v).toLocaleDateString() : "N/A"';
    }

    return field;
  });
}

/**
 * Find ID field in schema
 */
function findIdField(schema) {
  // Look for common ID field names
  const idFields = ['id', 'number', 'code'];

  for (const idField of idFields) {
    const found = schema.properties.find(p =>
      p.name.toLowerCase().includes(idField) &&
      (p.type === 'number' || p.type === 'string')
    );
    if (found) return found.name;
  }

  // Default to first property
  return schema.properties[0]?.name || 'id';
}

/**
 * Detect relationships (foreign keys)
 */
function detectRelationships(schema, spec) {
  const relationships = [];

  for (const prop of schema.properties) {
    // Look for fields ending in "Id" or "Number" that might be foreign keys
    if (prop.name.match(/(Id|Number)$/) && prop.name !== 'id') {
      const entityName = prop.name.replace(/(Id|Number)$/, '');

      // Check if there's a corresponding entity in the spec
      const relatedEntity = Object.keys(spec.components?.schemas || {})
        .find(name => name.toLowerCase().startsWith(entityName.toLowerCase()));

      if (relatedEntity) {
        relationships.push({
          field: prop.name,
          relatedEntity,
          displayField: entityName.toLowerCase() + 'Name',
          type: 'many-to-one',
        });
      }
    }
  }

  return relationships;
}

/**
 * Helper functions
 */

function formatLabel(fieldName) {
  // Convert camelCase to Title Case
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function pluralize(word) {
  // Simple pluralization (can be enhanced)
  if (word.endsWith('y')) {
    return word.slice(0, -1) + 'ies';
  }
  if (word.endsWith('s')) {
    return word; // Already plural or ends with s
  }
  return word + 's';
}

function extractResponseSchema(operation) {
  // Implementation depends on spec structure
  return 'unknown';
}

function extractRequestSchema(operation) {
  // Implementation depends on spec structure
  return undefined;
}

function extractParameters(operation) {
  return operation.parameters?.map((p) => ({
    name: p.name,
    in: p.in,
    type: p.schema?.type || 'string',
    required: p.required || false,
  })) || [];
}
