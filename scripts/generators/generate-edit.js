#!/usr/bin/env node

/**
 * Feature Generator - Edit Component
 *
 * Generates an edit/create form component from OpenAPI metadata
 *
 * Phase 2.1: Auto-configuration with Zod validation
 *
 * Usage:
 *   node scripts/generators/generate-edit.js <EntityName> [--dry-run] [--manual]
 *   node scripts/generators/generate-edit.js Personnel
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import { parseOpenAPISpec } from './openapi-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../..');

// Register Handlebars helpers
Handlebars.registerHelper('pascalCase', (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
});

Handlebars.registerHelper('camelCase', (str) => {
  return str.charAt(0).toLowerCase() + str.slice(1);
});

Handlebars.registerHelper('kebabCase', (str) => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
});

Handlebars.registerHelper('lowerCase', (str) => {
  return str.toLowerCase();
});

Handlebars.registerHelper('upperCase', (str) => {
  return str.toUpperCase();
});

/**
 * Manual entity configurations (fallback)
 */
const ENTITY_CONFIGS = {
  Personnel: {
    entityName: 'Personnel',
    entityPluralName: 'Personnel',
    idField: 'personnelNumber',
    idFieldType: 'string',
    idFieldDefault: "''",
    idFieldConversion: 'id',
    operations: {
      get: {
        functionName: 'referencePersonnelGetPersonnelByNumber',
      },
    },
    formFields: [
      {
        name: 'personnelNumber',
        zodType: 'z.string().min(1)',
        description: 'Personnel Number',
        colSpan: 1,
      },
      {
        name: 'name',
        zodType: 'z.string().min(1)',
        description: 'Full Name',
        colSpan: 2,
      },
      {
        name: 'email',
        zodType: 'z.string().email().optional().or(z.literal(""))',
        description: 'Email Address',
        colSpan: 1,
      },
      {
        name: 'phone',
        zodType: 'z.string().optional()',
        description: 'Phone Number',
        colSpan: 1,
      },
      {
        name: 'role',
        zodType: 'z.string().optional()',
        description: 'Role',
        colSpan: 1,
      },
      {
        name: 'isActive',
        zodType: 'z.boolean().default(true)',
        description: 'Active Status',
        colSpan: 1,
        type: 'checkbox',
      },
      {
        name: 'isAuditor',
        zodType: 'z.boolean().default(false)',
        description: 'Auditor Status',
        colSpan: 1,
        type: 'checkbox',
      },
    ],
    relationships: [],
  },
};

/**
 * Convert OpenAPI metadata to edit config
 */
function convertToEditConfig(entity) {
  // Determine ID field type and conversions
  const idProp = entity.schema.properties.find(p => p.name === entity.idField);
  const idFieldType = idProp?.type === 'number' ? 'number' : 'string';
  const idFieldDefault = idFieldType === 'number' ? '0' : "''";
  const idFieldConversion = idFieldType === 'number' ? 'Number(id)' : 'id';

  // Generate form fields from schema
  const formFields = entity.schema.properties
    .filter(prop => {
      // Exclude computed/readonly fields
      const excludePatterns = [
        /^(created|updated)(By|Date)$/i,
        /Count$/i,
        /^total/i,
      ];
      return !excludePatterns.some(pattern => pattern.test(prop.name));
    })
    .map(prop => {
      const field = {
        name: prop.name,
        zodType: getZodType(prop),
        description: prop.description || formatLabel(prop.name),
        colSpan: prop.type === 'string' && !prop.enum ? 2 : 1,
      };

      // Add type for special inputs
      if (prop.type === 'boolean') {
        field.type = 'checkbox';
      } else if (prop.format === 'date') {
        field.type = 'date';
        field.transform = '? new Date(data.' + prop.name + ').toISOString().split("T")[0] : undefined';
      } else if (prop.enum) {
        field.type = 'select';
        field.options = prop.enum;
      }

      return field;
    });

  // Map relationships to form config
  const relationships = entity.relationships.map(rel => ({
    field: rel.field,
    pluralName: pluralize(rel.relatedEntity),
    displayField: rel.displayField,
    valueField: rel.field.replace(/Id$/, 'Number') || rel.field,
    queryFunction: `reference${rel.relatedEntity}GetAll${pluralize(rel.relatedEntity)}`,
    options: `${camelCase(pluralize(rel.relatedEntity))}Options`,
  }));

  return {
    entityName: entity.name,
    entityPluralName: entity.pluralName,
    idField: entity.idField,
    idFieldType,
    idFieldDefault,
    idFieldConversion,
    operations: entity.operations,
    formFields,
    relationships,
  };
}

/**
 * Get Zod type from property info
 */
function getZodType(prop) {
  let zodType = '';

  // Base type
  if (prop.type === 'string') {
    if (prop.format === 'email') {
      zodType = 'z.string().email()';
    } else if (prop.format === 'date' || prop.format === 'date-time') {
      zodType = 'z.string()'; // Forms use string for dates
    } else if (prop.enum) {
      const enumValues = prop.enum.map(v => `"${v}"`).join(', ');
      zodType = `z.enum([${enumValues}])`;
    } else {
      zodType = 'z.string()';
      // Add min validation if required
      if (!prop.nullable) {
        zodType += '.min(1)';
      }
    }
  } else if (prop.type === 'number') {
    zodType = 'z.number()';
  } else if (prop.type === 'boolean') {
    zodType = `z.boolean().default(${prop.nullable ? 'false' : 'true'})`;
  } else {
    zodType = 'z.string()';
  }

  // Handle optional/nullable
  if (prop.nullable || !prop.required) {
    zodType += '.optional()';
    if (prop.type === 'string' && prop.format === 'email') {
      zodType += '.or(z.literal(""))';
    }
  }

  return zodType;
}

/**
 * Load entity configuration
 */
function loadEntityConfig(entityName, useManual = false) {
  const openapiPath = path.join(projectRoot, 'openapi-updated.json');

  // Check if OpenAPI spec exists and manual mode is not forced
  if (!useManual && fs.existsSync(openapiPath)) {
    console.log('📖 Reading OpenAPI specification...');
    try {
      const entities = parseOpenAPISpec(openapiPath);
      const entity = entities.find(e =>
        e.name.toLowerCase() === entityName.toLowerCase() ||
        e.endpoint.toLowerCase() === entityName.toLowerCase()
      );

      if (entity) {
        console.log(`✅ Auto-configured from OpenAPI spec\n`);
        return convertToEditConfig(entity);
      }
    } catch (error) {
      console.warn(`⚠️  Failed to parse OpenAPI spec: ${error.message}`);
      console.warn('Falling back to manual configuration...\n');
    }
  }

  // Fall back to manual configuration
  const config = ENTITY_CONFIGS[entityName];
  if (!config) return null;

  console.log('📋 Using manual configuration\n');
  return config;
}

/**
 * Load and compile template
 */
function loadTemplate(templateName) {
  const templatePath = path.join(__dirname, 'templates', `${templateName}.hbs`);
  const templateSource = fs.readFileSync(templatePath, 'utf8');
  return Handlebars.compile(templateSource);
}

/**
 * Generate edit component
 */
function generateComponent(entityName, config, options = {}) {
  const { dryRun = false, outputDir = path.join(projectRoot, 'src/app/features') } = options;

  console.log(`\n🚀 Generating edit component for: ${entityName}\n`);

  // Load template
  const template = loadTemplate('edit.component.ts');

  // Add kebab-case for template
  const kebabCase = entityName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();

  // Generate code
  const code = template({ ...config, kebabCase });

  // Determine output path
  const featureDir = path.join(outputDir, kebabCase);
  const componentPath = path.join(featureDir, `${kebabCase}-edit.component.ts`);

  if (dryRun) {
    console.log('📋 Dry run - Generated code preview:\n');
    console.log('─'.repeat(80));
    console.log(code.substring(0, 1500) + '\n... (truncated)');
    console.log('─'.repeat(80));
    console.log(`\n📄 Would write to: ${path.relative(projectRoot, componentPath)}\n`);
    return;
  }

  // Create directory if it doesn't exist
  if (!fs.existsSync(featureDir)) {
    fs.mkdirSync(featureDir, { recursive: true });
    console.log(`📁 Created directory: ${path.relative(projectRoot, featureDir)}`);
  }

  // Write file
  fs.writeFileSync(componentPath, code);
  console.log(`✅ Generated: ${path.relative(projectRoot, componentPath)}\n`);

  return componentPath;
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

function camelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const entityName = args[0];
  const dryRun = args.includes('--dry-run');
  const useManual = args.includes('--manual');

  if (!entityName) {
    console.error('❌ Error: Entity name required\n');
    console.log('Usage: node scripts/generators/generate-edit.js <EntityName> [--dry-run] [--manual]\n');

    const openapiPath = path.join(projectRoot, 'openapi-updated.json');
    if (fs.existsSync(openapiPath)) {
      try {
        const entities = parseOpenAPISpec(openapiPath);
        console.log('Available entities (from OpenAPI):');
        entities.forEach(e => console.log(`  - ${e.name} (${e.endpoint})`));
      } catch (error) {
        console.log('Available entities (manual):');
        Object.keys(ENTITY_CONFIGS).forEach((key) => {
          console.log(`  - ${key}`);
        });
      }
    } else {
      console.log('Available entities (manual):');
      Object.keys(ENTITY_CONFIGS).forEach((key) => {
        console.log(`  - ${key}`);
      });
    }
    console.log('');
    process.exit(1);
  }

  const config = loadEntityConfig(entityName, useManual);

  if (!config) {
    console.error(`❌ Error: No configuration found for entity "${entityName}"\n`);
    console.log('Available entities:');
    Object.keys(ENTITY_CONFIGS).forEach((key) => {
      console.log(`  - ${key}`);
    });
    console.log('');
    process.exit(1);
  }

  generateComponent(entityName, config, { dryRun });

  if (!dryRun) {
    console.log('✨ Next steps:');
    console.log(`  1. Add route to src/app/app.routes.ts`);
    console.log(`  2. Implement mutation logic in onSubmit()`);
    console.log(`  3. Test the component: ng serve\n`);
  }
}

main();
