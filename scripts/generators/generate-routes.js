#!/usr/bin/env node

/**
 * Feature Generator - Routes
 *
 * Generates route configuration for table and edit components
 *
 * Usage:
 *   node scripts/generators/generate-routes.js <EntityName> [--dry-run]
 *   node scripts/generators/generate-routes.js Personnel
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';

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

/**
 * Generate routes file
 */
function generateRoutes(entityName, options = {}) {
  const { dryRun = false, outputDir = path.join(projectRoot, 'src/app/features') } = options;

  const kebabCase = entityName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();

  const pascalCase = entityName.charAt(0).toUpperCase() + entityName.slice(1);

  console.log(`\n🚀 Generating routes for: ${entityName}\n`);

  // Generate routes code
  const routesCode = `import { Routes } from '@angular/router';

export const ${pascalCase}Routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./${kebabCase}-table.component').then((m) => m.${pascalCase}TableComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./${kebabCase}-edit.component').then((m) => m.${pascalCase}EditComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./${kebabCase}-edit.component').then((m) => m.${pascalCase}EditComponent),
  },
];
`;

  // Determine output path
  const featureDir = path.join(outputDir, kebabCase);
  const routesPath = path.join(featureDir, `${kebabCase}.routes.ts`);

  if (dryRun) {
    console.log('📋 Dry run - Generated routes preview:\n');
    console.log('─'.repeat(80));
    console.log(routesCode);
    console.log('─'.repeat(80));
    console.log(`\n📄 Would write to: ${path.relative(projectRoot, routesPath)}\n`);
    return;
  }

  // Create directory if it doesn't exist
  if (!fs.existsSync(featureDir)) {
    fs.mkdirSync(featureDir, { recursive: true });
    console.log(`📁 Created directory: ${path.relative(projectRoot, featureDir)}`);
  }

  // Write file
  fs.writeFileSync(routesPath, routesCode);
  console.log(`✅ Generated: ${path.relative(projectRoot, routesPath)}\n`);

  // Generate instructions for updating main routes
  const mainRoutesPath = path.join(projectRoot, 'src/app/app.routes.ts');
  const mainRoutesExists = fs.existsSync(mainRoutesPath);

  console.log('📝 Manual step required:');
  console.log(`\nAdd this to your ${mainRoutesExists ? 'app.routes.ts' : 'main routes file'}:\n`);
  console.log('─'.repeat(80));
  console.log(`import { ${pascalCase}Routes } from './features/${kebabCase}/${kebabCase}.routes';

export const routes: Routes = [
  // ... other routes
  {
    path: '${kebabCase}',
    children: ${pascalCase}Routes,
  },
];`);
  console.log('─'.repeat(80));
  console.log('');

  return routesPath;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const entityName = args[0];
  const dryRun = args.includes('--dry-run');

  if (!entityName) {
    console.error('❌ Error: Entity name required\n');
    console.log('Usage: node scripts/generators/generate-routes.js <EntityName> [--dry-run]\n');
    process.exit(1);
  }

  generateRoutes(entityName, { dryRun });

  if (!dryRun) {
    console.log('✨ Next steps:');
    console.log(`  1. Copy the route import and configuration above`);
    console.log(`  2. Update your app.routes.ts file`);
    console.log(`  3. Test navigation: ng serve\n`);
  }
}

main();
