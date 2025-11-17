#!/usr/bin/env node

/**
 * Migration Execution Script
 *
 * Automatically migrates code from manual API services to generated code.
 *
 * Usage:
 *   node scripts/migrate-execute.js --dry-run    # Preview changes without modifying files
 *   node scripts/migrate-execute.js              # Execute migration
 *   node scripts/migrate-execute.js --file path  # Migrate specific file only
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fileArg = args.indexOf('--file');
const specificFile = fileArg !== -1 ? args[fileArg + 1] : null;

// Configuration
const CONFIG = {
  srcDir: path.join(projectRoot, 'src/app'),
  planFile: path.join(projectRoot, '.migration/migration-plan.json'),
  backupDir: path.join(projectRoot, '.migration/backup'),
  generatedImportPath: '@/core/api/generated',
};

/**
 * Service method mappings
 */
const SERVICE_MAPPINGS = {
  // Audits Service
  'auditsService.getAllAuditsQuery': {
    import: 'auditsGetAllAuditsOptions',
    usage: (params) => `injectQuery(() => auditsGetAllAuditsOptions({ query: ${params || '{}'} }))`,
  },
  'auditsService.getAuditByIdQuery': {
    import: 'auditsGetAuditByIdOptions',
    usage: (id) => `injectQuery(() => auditsGetAuditByIdOptions({ path: { id: ${id} } }))`,
  },
  'auditsService.searchAuditsQuery': {
    import: 'auditsSearchAuditsOptions',
    usage: (params) => `injectQuery(() => auditsSearchAuditsOptions({ query: ${params} }))`,
  },
  'auditsService.createAuditMutation': {
    import: 'auditsCreateAudit',
    usage: () => `injectMutation(() => ({ mutationFn: (data: CreateAuditRequest) => auditsCreateAudit({ body: data }) }))`,
  },
  'auditsService.updateAuditMutation': {
    import: 'auditsUpdateAudit',
    usage: () => `injectMutation(() => ({ mutationFn: ({ id, data }: { id: number; data: UpdateAuditRequest }) => auditsUpdateAudit({ path: { id }, body: data }) }))`,
  },

  // Reference Audits Service
  'referenceAuditsService.getReferenceAuditsQuery': {
    import: 'referenceAuditsGetReferenceAuditsOptions',
    usage: (params) => `injectQuery(() => referenceAuditsGetReferenceAuditsOptions({ query: ${params || '{}'} }))`,
  },
  'referenceAuditsService.getAuditByNumberQuery': {
    import: 'referenceAuditsGetAuditByAuditNumberOptions',
    usage: (auditNumber) => `injectQuery(() => referenceAuditsGetAuditByAuditNumberOptions({ path: { auditNumber: ${auditNumber} } }))`,
  },

  // Suppliers Service
  'suppliersService.getSuppliersQuery': {
    import: 'referenceSuppliersGetAllSuppliersOptions',
    usage: (params) => `injectQuery(() => referenceSuppliersGetAllSuppliersOptions({ query: ${params || '{}'} }))`,
  },
  'suppliersService.getSupplierQuery': {
    import: 'referenceSuppliersGetSupplierByNumberOptions',
    usage: (supplierNumber) => `injectQuery(() => referenceSuppliersGetSupplierByNumberOptions({ path: { supplierNumber: ${supplierNumber} } }))`,
  },
  'suppliersService.searchSuppliersQuery': {
    import: 'referenceSuppliersSearchSuppliersOptions',
    usage: (params) => `injectQuery(() => referenceSuppliersSearchSuppliersOptions({ query: ${params} }))`,
  },

  // SuppliersQueryService
  'suppliersQueryService.createPaginatedQuery': {
    import: 'referenceSuppliersGetAllSuppliersOptions',
    usage: (params) => `injectQuery(() => referenceSuppliersGetAllSuppliersOptions({ query: ${params} }))`,
  },
  'suppliersQueryService.createSupplierQuery': {
    import: 'referenceSuppliersGetSupplierByNumberOptions',
    usage: (supplierNumber) => `injectQuery(() => referenceSuppliersGetSupplierByNumberOptions({ path: { supplierNumber: ${supplierNumber} } }))`,
  },
};

/**
 * Type mappings from manual to generated
 */
const TYPE_MAPPINGS = {
  'PaginatedResponse<AuditResponse>': 'PaginatedResponseOfAuditResponse',
  'PaginatedResponse<SupplierDetailsResponse>': 'PaginatedResponseOfSupplierDetailsResponse',
  'PaginatedResponse<AuditDetailsResponse>': 'PaginatedResponseOfAuditDetailsResponse',
};

/**
 * Load migration plan
 */
function loadMigrationPlan() {
  if (!fs.existsSync(CONFIG.planFile)) {
    console.error('❌ Migration plan not found!');
    console.error('   Run: node scripts/migrate-analyze.js first\n');
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(CONFIG.planFile, 'utf8'));
}

/**
 * Create backup of a file
 */
function backupFile(filePath) {
  const relativePath = path.relative(CONFIG.srcDir, filePath);
  const backupPath = path.join(CONFIG.backupDir, relativePath);
  const backupDir = path.dirname(backupPath);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

/**
 * Replace model imports
 */
function replaceModelImports(content) {
  const changes = [];

  // Replace imports from @core/api/models
  const modelsImportRegex = /import\s+{([^}]+)}\s+from\s+['"](.+\/)?core\/api\/models['"]/g;
  const newContent = content.replace(modelsImportRegex, (match, imports, prefix) => {
    changes.push({ type: 'import', from: 'models', imports: imports.trim() });
    return `import type { ${imports} } from '${CONFIG.generatedImportPath}'`;
  });

  return { content: newContent, changes };
}

/**
 * Replace schema imports
 */
function replaceSchemaImports(content) {
  const changes = [];

  // Replace imports from @core/api/schemas
  const schemasImportRegex = /import\s+{([^}]+)}\s+from\s+['"](.+\/)?core\/api\/schemas['"]/g;
  const newContent = content.replace(schemasImportRegex, (match, imports, prefix) => {
    changes.push({ type: 'import', from: 'schemas', imports: imports.trim() });

    // Map schema names to generated equivalents (add 'z' prefix for Zod schemas)
    const importList = imports.split(',').map(i => i.trim());
    const mappedImports = importList.map(imp => {
      // Remove 'Schema' suffix and add 'z' prefix
      const baseName = imp.replace('Schema', '');
      return `z${baseName}`;
    });

    return `import { ${mappedImports.join(', ')} } from '${CONFIG.generatedImportPath}'`;
  });

  return { content: newContent, changes };
}

/**
 * Replace service imports and inject statements
 */
function replaceServiceImports(content) {
  const changes = [];
  let newContent = content;

  // Remove service imports
  const serviceImportRegex = /import\s+{([^}]+)}\s+from\s+['"](.+\/)?core\/api\/services\/[^'"]+['"]/g;
  newContent = newContent.replace(serviceImportRegex, (match, imports, prefix) => {
    changes.push({ type: 'remove-service-import', imports: imports.trim() });
    return ''; // Remove the import
  });

  // Remove service inject statements
  const injectRegex = /(private|public|readonly)?\s*(readonly)?\s+(\w+Service)\s*=\s*inject\((\w+Service)\)/g;
  newContent = newContent.replace(injectRegex, (match) => {
    changes.push({ type: 'remove-inject', match });
    return ''; // Remove the inject statement
  });

  // Add injectQuery and injectMutation imports if not present
  if (!newContent.includes('injectQuery') && content.includes('Query(')) {
    const angularImportMatch = newContent.match(/import\s+{([^}]+)}\s+from\s+['"]@angular\/core['"]/);
    if (angularImportMatch) {
      newContent = newContent.replace(
        angularImportMatch[0],
        angularImportMatch[0].replace('}', ', inject }')
      );
    }

    // Add TanStack Query imports
    const tanstackImport = `import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';\n`;
    const firstImportIndex = newContent.indexOf('import');
    if (firstImportIndex !== -1) {
      newContent = newContent.slice(0, firstImportIndex) + tanstackImport + newContent.slice(firstImportIndex);
    }

    changes.push({ type: 'add-tanstack-import' });
  }

  return { content: newContent, changes };
}

/**
 * Replace service method calls
 */
function replaceServiceMethodCalls(content) {
  const changes = [];
  let newContent = content;

  // Track which generated functions we need to import
  const requiredImports = new Set();

  // Pattern: this.auditsService.getAllAuditsQuery(params)
  const methodCallRegex = /this\.(\w+)\.(\w+)\(([^)]*)\)/g;
  let match;
  const replacements = [];

  while ((match = methodCallRegex.exec(content)) !== null) {
    const [fullMatch, service, method, params] = match;
    const serviceMethod = `${service}.${method}`;

    // Check if we have a mapping for this service method
    const mapping = SERVICE_MAPPINGS[serviceMethod];
    if (mapping) {
      const newCode = mapping.usage(params);
      replacements.push({ oldCode: fullMatch, newCode, position: match.index });
      requiredImports.add(mapping.import);
      changes.push({ type: 'replace-method', service, method, params });
    }
  }

  // Apply replacements in reverse order to maintain positions
  for (const replacement of replacements.reverse()) {
    newContent =
      newContent.slice(0, replacement.position) +
      replacement.newCode +
      newContent.slice(replacement.position + replacement.oldCode.length);
  }

  // Add imports for generated functions
  if (requiredImports.size > 0) {
    const generatedImport = `import { ${Array.from(requiredImports).join(', ')} } from '${CONFIG.generatedImportPath}';\n`;
    const firstImportIndex = newContent.indexOf('import');
    if (firstImportIndex !== -1) {
      newContent = newContent.slice(0, firstImportIndex) + generatedImport + newContent.slice(firstImportIndex);
    }
    changes.push({ type: 'add-generated-imports', imports: Array.from(requiredImports) });
  }

  return { content: newContent, changes };
}

/**
 * Clean up empty lines and formatting
 */
function cleanupFormatting(content) {
  return content
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove multiple blank lines
    .replace(/import.*from.*;?\n\n+import/g, (match) => match.replace(/\n\n+/, '\n')) // Single line between imports
    .trim() + '\n';
}

/**
 * Migrate a single file
 */
function migrateFile(filePath) {
  const relativePath = path.relative(projectRoot, filePath);
  console.log(`\n📝 Migrating: ${relativePath}`);

  let content = fs.readFileSync(filePath, 'utf8');
  const allChanges = [];

  // Step 1: Replace model imports
  const modelResult = replaceModelImports(content);
  content = modelResult.content;
  allChanges.push(...modelResult.changes);

  // Step 2: Replace schema imports
  const schemaResult = replaceSchemaImports(content);
  content = schemaResult.content;
  allChanges.push(...schemaResult.changes);

  // Step 3: Replace service imports
  const serviceResult = replaceServiceImports(content);
  content = serviceResult.content;
  allChanges.push(...serviceResult.changes);

  // Step 4: Replace service method calls
  const methodResult = replaceServiceMethodCalls(content);
  content = methodResult.content;
  allChanges.push(...methodResult.changes);

  // Step 5: Clean up formatting
  content = cleanupFormatting(content);

  if (allChanges.length === 0) {
    console.log('   ⏭️  No changes needed');
    return { success: true, changes: [] };
  }

  // Print changes
  console.log('   Changes:');
  for (const change of allChanges) {
    if (change.type === 'import') {
      console.log(`     - Updated import from ${change.from}: ${change.imports}`);
    } else if (change.type === 'remove-service-import') {
      console.log(`     - Removed service import: ${change.imports}`);
    } else if (change.type === 'remove-inject') {
      console.log(`     - Removed inject statement`);
    } else if (change.type === 'add-tanstack-import') {
      console.log(`     - Added TanStack Query imports`);
    } else if (change.type === 'add-generated-imports') {
      console.log(`     - Added generated imports: ${change.imports.join(', ')}`);
    } else if (change.type === 'replace-method') {
      console.log(`     - Replaced: ${change.service}.${change.method}()`);
    }
  }

  if (!dryRun) {
    // Create backup
    const backupPath = backupFile(filePath);
    console.log(`   💾 Backup created: ${path.relative(projectRoot, backupPath)}`);

    // Write migrated content
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ File migrated`);
  } else {
    console.log(`   👀 Dry run - no changes written`);
  }

  return { success: true, changes: allChanges };
}

/**
 * Main migration
 */
function main() {
  console.log('🚀 API Migration Execution\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }

  // Load migration plan
  const { plan, filesToMigrate } = loadMigrationPlan();

  let filesToProcess = filesToMigrate;

  // Filter to specific file if requested
  if (specificFile) {
    const fullPath = path.resolve(projectRoot, specificFile);
    filesToProcess = filesToMigrate.filter(f =>
      path.resolve(projectRoot, f.path) === fullPath
    );

    if (filesToProcess.length === 0) {
      console.error(`❌ File not found in migration plan: ${specificFile}\n`);
      process.exit(1);
    }

    console.log(`📄 Migrating specific file: ${specificFile}\n`);
  }

  console.log(`📊 Files to migrate: ${filesToProcess.length}\n`);

  // Process each file
  const results = [];
  for (const fileInfo of filesToProcess) {
    const filePath = path.resolve(projectRoot, fileInfo.path);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${fileInfo.path} (skipping)`);
      continue;
    }

    const result = migrateFile(filePath);
    results.push({ file: fileInfo.path, ...result });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary\n');

  const successful = results.filter(r => r.success).length;
  const withChanges = results.filter(r => r.changes.length > 0).length;

  console.log(`✅ Successfully processed: ${successful}/${results.length}`);
  console.log(`📝 Files with changes: ${withChanges}`);

  if (dryRun) {
    console.log('\n💡 This was a dry run. Run without --dry-run to apply changes.\n');
  } else {
    console.log(`\n💾 Backups saved to: ${path.relative(projectRoot, CONFIG.backupDir)}`);
    console.log('\n✅ Migration complete!\n');
    console.log('Next steps:');
    console.log('  1. Review the changes (git diff)');
    console.log('  2. Run: node scripts/migrate-validate.js');
    console.log('  3. Test your application');
    console.log('  4. If issues occur, restore from backups\n');
  }
}

// Run migration
main();
