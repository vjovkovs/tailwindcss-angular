#!/usr/bin/env node

/**
 * Feature Generator - Table Component
 *
 * Generates a table component from a template using OpenAPI metadata
 *
 * Phase 2.1: Auto-configuration from OpenAPI spec
 *
 * Usage:
 *   node scripts/generators/generate-table.js <EntityName> [--dry-run] [--manual]
 *   node scripts/generators/generate-table.js Personnel
 *   node scripts/generators/generate-table.js Personnel --manual  # Use manual config
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
 * Entity configurations
 * TODO: Auto-generate from OpenAPI spec
 */
const ENTITY_CONFIGS = {
  Personnel: {
    entityName: 'Personnel',
    entityPluralName: 'Personnel',
    apiFunction: 'referencePersonnelGetPersonnel',
    idField: 'personnelNumber',
    columns: [
      {
        label: 'Personnel #',
        field: 'personnelNumber',
        sortable: true,
        width: '120px',
      },
      {
        label: 'Name',
        field: 'name',
        sortable: true,
      },
      {
        label: 'Email',
        field: 'email',
        sortable: true,
      },
      {
        label: 'Member',
        field: 'memberName',
        sortable: true,
      },
      {
        label: 'Role',
        field: 'role',
        sortable: true,
      },
      {
        label: 'Utility',
        field: 'utilityCode',
        sortable: true,
        width: '100px',
      },
      {
        label: 'Active',
        field: 'isActive',
        sortable: true,
        width: '80px',
        format: '(value) => (value ? "Yes" : "No")',
        columnClass: 'px-6 py-4 text-sm text-center',
      },
      {
        label: 'Auditor',
        field: 'isAuditor',
        sortable: true,
        width: '80px',
        format: '(value) => (value ? "Yes" : "No")',
        columnClass: 'px-6 py-4 text-sm text-center',
      },
    ],
    previewFields: [
      { label: 'Personnel Number', field: 'personnelNumber' },
      { label: 'Personnel ID', field: 'personnelId' },
      { label: 'Name', field: 'name' },
      { label: 'Email', field: 'email' },
      { label: 'Member Code', field: 'memberCode' },
      { label: 'Member Name', field: 'memberName' },
      { label: 'Role', field: 'role' },
      { label: 'Phone', field: 'phone' },
      { label: 'Utility Code', field: 'utilityCode' },
      {
        label: 'Active',
        field: 'isActive',
        format: '(v) => (v ? "Yes" : "No")',
        class: `{{camelCase entityName}}.isActive ? 'mt-1 text-sm font-medium text-green-600' : 'mt-1 text-sm font-medium text-red-600'`,
      },
      {
        label: 'Auditor',
        field: 'isAuditor',
        format: '(v) => (v ? "Yes" : "No")',
      },
    ],
  },
};

/**
 * Load and compile template
 */
function loadTemplate(templateName) {
  const templatePath = path.join(__dirname, 'templates', `${templateName}.hbs`);
  const templateSource = fs.readFileSync(templatePath, 'utf8');
  return Handlebars.compile(templateSource);
}

/**
 * Generate component file
 */
function generateComponent(entityName, config, options = {}) {
  const { dryRun = false, outputDir = path.join(projectRoot, 'src/app/features') } = options;

  console.log(`\n🚀 Generating table component for: ${entityName}\n`);

  // Load template
  const template = loadTemplate('table-simple.component.ts');

  // Generate code
  const code = template(config);

  // Determine output path
  const featureDir = path.join(outputDir, config.kebabCase || entityName.toLowerCase());
  const componentPath = path.join(featureDir, `${config.kebabCase || entityName.toLowerCase()}-table-simple.component.ts`);

  if (dryRun) {
    console.log('📋 Dry run - Generated code preview:\n');
    console.log('─'.repeat(80));
    console.log(code.substring(0, 1000) + '\n... (truncated)');
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

        // Convert to legacy config format for template compatibility
        return {
          entityName: entity.name,
          entityPluralName: entity.pluralName,
          apiFunction: entity.operations.list?.functionName || '',
          idField: entity.idField,
          columns: entity.columns,
          previewFields: entity.previewFields,
          operations: entity.operations,
          relationships: entity.relationships,
          kebabCase: entity.name
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .toLowerCase(),
        };
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

  // Add computed kebab-case to config
  config.kebabCase = entityName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();

  return config;
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
    console.log('Usage: node scripts/generators/generate-table.js <EntityName> [--dry-run] [--manual]\n');

    // Try to show available entities from OpenAPI
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

    const openapiPath = path.join(projectRoot, 'openapi-updated.json');
    if (fs.existsSync(openapiPath) && !useManual) {
      try {
        const entities = parseOpenAPISpec(openapiPath);
        console.log('Available entities:');
        entities.forEach(e => console.log(`  - ${e.name} (${e.endpoint})`));
      } catch (error) {
        console.log('Available entities:');
        Object.keys(ENTITY_CONFIGS).forEach((key) => {
          console.log(`  - ${key}`);
        });
      }
    } else {
      console.log('Available entities:');
      Object.keys(ENTITY_CONFIGS).forEach((key) => {
        console.log(`  - ${key}`);
      });
    }
    console.log('');
    process.exit(1);
  }

  generateComponent(entityName, config, { dryRun });

  if (!dryRun) {
    console.log('✨ Next steps:');
    console.log(`  1. Add route to src/app/app.routes.ts`);
    console.log(`  2. Test the component: ng serve`);
    console.log(`  3. Customize columns and preview fields as needed\n`);
  }
}

main();
