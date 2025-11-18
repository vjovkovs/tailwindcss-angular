/**
 * OpenAPI Spec Parser
 *
 * Automatically extracts entity metadata from OpenAPI specification
 * Eliminates need for manual entity configurations
 */

import fs from 'fs';
import path from 'path';

// Global debug flag
let DEBUG_MODE = false;

/**
 * Debug logging utility
 */
function debug(...args) {
  if (DEBUG_MODE) {
    console.log('[DEBUG]', ...args);
  }
}

/**
 * Info logging (always shown)
 */
function info(...args) {
  console.log('[INFO]', ...args);
}

/**
 * Error logging (always shown)
 */
function error(...args) {
  console.error('[ERROR]', ...args);
}

/**
 * Success logging (always shown)
 */
function success(...args) {
  console.log('[SUCCESS]', ...args);
}

/**
 * Warning logging (always shown)
 */
function warn(...args) {
  console.warn('[WARN]', ...args);
}

/**
 * Set debug mode based on command line arguments or explicit flag
 */
export function setDebugMode(enabled = false) {
  DEBUG_MODE = enabled;
  debug('Debug mode enabled');
}

/**
 * Check command line arguments for debug flags
 */
function checkDebugFlags() {
  const args = process.argv.slice(2);
  return args.includes('--debug') || args.includes('-d');
}

/**
 * Parse OpenAPI specification and extract entity metadata
 */
export function parseOpenAPISpec(specPath, enableDebug = null) {
  // Set debug mode from parameter or command line args
  if (enableDebug !== null) {
    setDebugMode(enableDebug);
  } else {
    setDebugMode(checkDebugFlags());
  }

  debug(`Loading OpenAPI spec from: ${specPath}`);
  
  let spec;
  try {
    spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  } catch (err) {
    error('Failed to load OpenAPI spec:', err.message);
    return [];
  }

  debug('Loaded paths:', Object.keys(spec.paths || {}));
  const entities = [];

  // Group paths by entity
  const entityPaths = groupPathsByEntity(spec.paths || {});
  debug('Grouped entities:', Array.from(entityPaths.keys()));

  // Convert Map to entries for iteration
  for (const [entityName, paths] of entityPaths.entries()) {
    debug(`Processing entity: ${entityName}`);
    debug(`Paths for ${entityName}:`, paths.map(p => p.path));
    
    const metadata = extractEntityMetadata(entityName, paths, spec);
    debug(`Extracted metadata for entity ${entityName}:`, metadata);
    
    if (metadata) {
      entities.push(metadata);
      success(`Successfully extracted metadata for ${metadata.name}`);
    } else {
      warn(`No metadata extracted for entity: ${entityName}`);
    }
  }

  success(`Successfully extracted ${entities.length} entities`);
  return entities;
}

/**
 * Group API paths by entity name
 */
function groupPathsByEntity(paths) {
  const grouped = new Map();

  for (const [path, pathItem] of Object.entries(paths)) {
    debug(`Processing path: ${path}`);
    
    // Extract entity from path: /api/ReferencePersonnel -> ReferencePersonnel
    // Support both /api/Entity and /Entity patterns
    const match = path.match(/^\/(?:api\/)?([^\/\{]+)/);
    if (!match) {
      debug(`No entity match for path: ${path}`);
      continue;
    }

    let entityName = match[1];
    
    // Normalize entity name (remove hyphens, consistent casing)
    entityName = entityName.replace(/-/g, '');
    
    debug(`Matched entity: ${entityName} from path: ${path}`);

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
  debug(`\n=== Extracting metadata for ${entityName} ===`);
  
  // Find operations
  const operations = extractOperations(entityName, paths, spec);
  debug(`Operations for entity ${entityName}:`, Object.keys(operations));
  
  if (!operations.list && !operations.get) {
    debug(`No valid operations found for entity: ${entityName}`);
    return null;
  }

  // Prefer list operation, but try all operations to find a valid schema
  let primaryOp = operations.list || operations.get;
  let responseSchemaName = getResponseSchemaName(primaryOp, spec);
  
  // If primary operation doesn't have a schema, try other operations
  if (!responseSchemaName) {
    debug(`Primary operation ${primaryOp.operationId} has no schema, trying other operations...`);
    
    for (const [opType, op] of Object.entries(operations)) {
      if (op && op !== primaryOp) {
        debug(`Trying operation: ${op.operationId}`);
        responseSchemaName = getResponseSchemaName(op, spec);
        if (responseSchemaName) {
          primaryOp = op;
          debug(`Found schema in ${op.operationId}: ${responseSchemaName}`);
          break;
        }
      }
    }
  }
  
  if (!responseSchemaName) {
    debug(`No response schema found for entity: ${entityName}`);
    return null;
  }

  // Extract schema info
  const schema = extractSchemaInfo(responseSchemaName, spec);
  if (!schema) {
    debug(`Schema not found: ${responseSchemaName}`);
    return null;
  }

  debug(`Schema extracted: ${schema.properties.length} properties`);

  // Generate columns from schema
  const columns = generateColumns(schema);
  const previewFields = generatePreviewFields(schema);
  const idField = findIdField(schema);
  const relationships = detectRelationships(schema, spec);

  // Clean entity name (remove "Reference" prefix if present)
  const cleanName = entityName.replace(/^Reference/, '');

  const result = {
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

  debug(`Successfully extracted metadata for ${cleanName}`);
  return result;
}

/**
 * Extract CRUD operations from paths
 */
function extractOperations(entityName, paths, spec) {
  const operations = {};

  for (const pathItem of paths) {
    const { path, ...methods } = pathItem;
    debug(`Checking path: ${path}, methods: ${Object.keys(methods)}`);

    // List operation: GET without path parameters
    if (methods.get && !path.includes('{')) {
      const op = methods.get;
      debug(`Found list operation: ${op.operationId}`);
      operations.list = {
        operationId: op.operationId,
        path,
        method: 'get',
        functionName: extractFunctionName(op.operationId),
        responseSchema: extractResponseSchema(op),
        parameters: extractParameters(op),
      };
    }

    // Get by ID: GET with path parameters
    if (methods.get && path.includes('{')) {
      const op = methods.get;
      debug(`Found get operation: ${op.operationId}`);
      operations.get = {
        operationId: op.operationId,
        path,
        method: 'get',
        functionName: extractFunctionName(op.operationId),
        responseSchema: extractResponseSchema(op),
        parameters: extractParameters(op),
      };
    }

    // Create: POST
    if (methods.post) {
      const op = methods.post;
      debug(`Found create operation: ${op.operationId}`);
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

    // Update: PUT
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

    // Delete: DELETE
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
 */
function extractFunctionName(operationId) {
  if (!operationId) return 'unknown';
  return operationId
    .replace(/_/g, '')
    .replace(/^./, (c) => c.toLowerCase());
}

/**
 * Get response schema name from operation
 */
function getResponseSchemaName(operation, spec) {
  if (!operation?.operationId) return null;

  // Find operation definition in spec
  const opDef = findOperationInSpec(operation.operationId, spec);
  if (!opDef) {
    debug(`Operation not found in spec: ${operation.operationId}`);
    return null;
  }

  const response200 = opDef.responses?.['200'];
  if (!response200) {
    debug(`No 200 response found for: ${operation.operationId}`);
    return null;
  }

  const schema = response200.content?.['application/json']?.schema;
  if (!schema) {
    debug(`No JSON schema found for: ${operation.operationId}`);
    return null;
  }

  debug(`Schema structure for ${operation.operationId}:`, JSON.stringify(schema, null, 2));

  // Direct $ref
  if (schema.$ref) {
    const schemaName = schema.$ref.split('/').pop();
    debug(`Direct $ref found: ${schemaName}`);
    return schemaName;
  }

  // Handle direct arrays: {"type": "array", "items": {"$ref": "..."}}
  if (schema.type === 'array' && schema.items?.$ref) {
    const schemaName = schema.items.$ref.split('/').pop();
    debug(`Found direct array schema: ${schemaName}`);
    return schemaName;
  }

  // Check for wrapper properties (data, items, result, value)
  const wrapperKeys = ['data', 'items', 'result', 'value'];
  for (const key of wrapperKeys) {
    const prop = schema.properties?.[key];
    if (prop) {
      debug(`Checking wrapper property '${key}':`, prop);
      
      // Array of items
      if (prop.type === 'array' && prop.items?.$ref) {
        const schemaName = prop.items.$ref.split('/').pop();
        debug(`Found array items schema: ${schemaName}`);
        return schemaName;
      }
      
      // Direct reference
      if (prop.$ref) {
        const schemaName = prop.$ref.split('/').pop();
        debug(`Found direct reference: ${schemaName}`);
        return schemaName;
      }
      
      // Nested oneOf (like in ResultOfPaginatedResponseOfPersonnelResponse)
      if (prop.oneOf && prop.oneOf[0]?.$ref) {
        const schemaName = prop.oneOf[0].$ref.split('/').pop();
        debug(`Found oneOf reference: ${schemaName}`);
        return schemaName;
      }
    }
  }

  // Check allOf patterns
  if (schema.allOf) {
    for (const subSchema of schema.allOf) {
      if (subSchema.$ref) {
        const schemaName = subSchema.$ref.split('/').pop();
        debug(`Found allOf reference: ${schemaName}`);
        return schemaName;
      }
      
      // Check properties in allOf
      for (const key of wrapperKeys) {
        const prop = subSchema.properties?.[key];
        if (prop?.items?.$ref) {
          const schemaName = prop.items.$ref.split('/').pop();
          debug(`Found allOf array items: ${schemaName}`);
          return schemaName;
        }
        if (prop?.$ref) {
          const schemaName = prop.$ref.split('/').pop();
          debug(`Found allOf direct reference: ${schemaName}`);
          return schemaName;
        }
        // Handle oneOf in allOf
        if (prop?.oneOf && prop.oneOf[0]?.$ref) {
          const schemaName = prop.oneOf[0].$ref.split('/').pop();
          debug(`Found allOf oneOf reference: ${schemaName}`);
          return schemaName;
        }
      }
    }
  }

  debug(`No schema reference found for: ${operation.operationId}`);
  return null;
}

/**
 * Find operation definition in spec
 */
function findOperationInSpec(operationId, spec) {
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
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
  if (!schema) {
    debug(`Schema definition not found: ${schemaName}`);
    return null;
  }

  debug(`Extracting properties from schema: ${schemaName}`);
  const properties = [];

  // Handle schema properties
  const schemaProps = schema.properties || {};
  for (const [propName, propDef] of Object.entries(schemaProps)) {
    properties.push({
      name: propName,
      type: getTypeFromSchema(propDef),
      format: propDef.format,
      nullable: propDef.nullable || false,
      description: propDef.description,
      enum: propDef.enum,
    });
  }

  debug(`Extracted ${properties.length} properties from ${schemaName}`);
  
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
  if (!prop) return 'any';
  if (prop.type === 'integer') return 'number';
  if (prop.type === 'string' && prop.format === 'date-time') return 'Date';
  if (prop.type === 'array') return 'Array';
  if (prop.type === 'boolean') return 'boolean';
  return prop.type || 'string';
}

/**
 * Generate table columns from schema
 */
function generateColumns(schema) {
  if (!schema?.properties) return [];
  
  const columns = [];
  const maxColumns = 8;

  // Priority fields for display
  const priorityFields = ['id', 'number', 'name', 'email', 'status', 'isActive', 'createdDate'];

  // Sort properties by priority
  const sorted = [...schema.properties].sort((a, b) => {
    const aPriority = priorityFields.findIndex(pf => 
      a.name.toLowerCase().includes(pf.toLowerCase())
    );
    const bPriority = priorityFields.findIndex(pf => 
      b.name.toLowerCase().includes(pf.toLowerCase())
    );

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
  if (!schema?.properties) return [];
  
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
  if (!schema?.properties) return 'id';
  
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
  if (!schema?.properties) return [];
  
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
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function pluralize(word) {
  if (word.endsWith('y')) {
    return word.slice(0, -1) + 'ies';
  }
  if (word.endsWith('s')) {
    return word;
  }
  return word + 's';
}

function extractResponseSchema(operation) {
  // This could be enhanced to extract actual schema from operation
  return operation?.responses?.['200']?.content?.['application/json']?.schema?.$ref?.split('/').pop() || 'unknown';
}

function extractRequestSchema(operation) {
  return operation?.requestBody?.content?.['application/json']?.schema?.$ref?.split('/').pop();
}

function extractParameters(operation) {
  return operation?.parameters?.map((p) => ({
    name: p.name,
    in: p.in,
    type: p.schema?.type || 'string',
    required: p.required || false,
  })) || [];
}