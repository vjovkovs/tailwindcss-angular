#!/usr/bin/env node

/**
 * Migration Analysis Script
 *
 * Analyzes the codebase to create a migration plan from manual API code to generated code.
 *
 * Usage: node scripts/migrate-analyze.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Configuration
const CONFIG = {
  srcDir: path.join(projectRoot, 'src/app'),
  generatedDir: path.join(projectRoot, 'src/app/core/api/generated'),
  manualModelsFile: path.join(projectRoot, 'src/app/core/api/models/index.ts'),
  manualSchemasFile: path.join(projectRoot, 'src/app/core/api/schemas/index.ts'),
  manualServicesDir: path.join(projectRoot, 'src/app/core/api/services'),
  outputDir: path.join(projectRoot, '.migration'),
};

// Track all findings
const findings = {
  modelsImports: [],
  schemasImports: [],
  servicesImports: [],
  customLogic: [],
  components: [],
  summary: {},
};

/**
 * Recursively find all TypeScript files
 */
function findTsFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.includes('generated')) {
      findTsFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Analyze a file for manual API imports
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(projectRoot, filePath);

  const result = {
    path: relativePath,
    modelsImports: [],
    schemasImports: [],
    servicesImports: [],
    hasCustomLogic: false,
  };

  // Find imports from manual models
  const modelsRegex = /import\s+{([^}]+)}\s+from\s+['"](\.\.\/)*core\/api\/models['"]/g;
  let match;
  while ((match = modelsRegex.exec(content)) !== null) {
    const imports = match[1].split(',').map(i => i.trim()).filter(Boolean);
    result.modelsImports.push(...imports);
  }

  // Find imports from manual schemas
  const schemasRegex = /import\s+{([^}]+)}\s+from\s+['"](\.\.\/)*core\/api\/schemas['"]/g;
  while ((match = schemasRegex.exec(content)) !== null) {
    const imports = match[1].split(',').map(i => i.trim()).filter(Boolean);
    result.schemasImports.push(...imports);
  }

  // Find imports from manual services
  const servicesRegex = /import\s+{([^}]+)}\s+from\s+['"](\.\.\/)*core\/api\/services\/([^'"]+)['"]/g;
  while ((match = servicesRegex.exec(content)) !== null) {
    const imports = match[1].split(',').map(i => i.trim()).filter(Boolean);
    const serviceName = match[3];
    result.servicesImports.push({ imports, serviceName });
  }

  // Check for custom transformation logic
  if (content.includes('transformSupplierData') ||
      content.includes('hasContact') ||
      content.includes('hasEmail') ||
      content.includes('location:')) {
    result.hasCustomLogic = true;
  }

  return result;
}

/**
 * Analyze service method usage patterns
 */
function analyzeServiceUsage(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const methods = [];

  // Find TanStack Query method calls
  const queryRegex = /(\w+)\.(\w+Query)\(([^)]*)\)/g;
  let match;
  while ((match = queryRegex.exec(content)) !== null) {
    methods.push({
      service: match[1],
      method: match[2],
      params: match[3].trim(),
    });
  }

  // Find mutation calls
  const mutationRegex = /(\w+)\.(\w+Mutation)\(\)/g;
  while ((match = mutationRegex.exec(content)) !== null) {
    methods.push({
      service: match[1],
      method: match[2],
      params: '',
    });
  }

  return methods;
}

/**
 * Load and parse generated files to create mapping
 */
function analyzeGeneratedCode() {
  const mapping = {
    types: [],
    queryOptions: [],
    mutations: [],
  };

  try {
    // Analyze types.gen.ts
    const typesFile = path.join(CONFIG.generatedDir, 'types.gen.ts');
    if (fs.existsSync(typesFile)) {
      const content = fs.readFileSync(typesFile, 'utf8');
      const typeRegex = /export type (\w+) = {/g;
      let match;
      while ((match = typeRegex.exec(content)) !== null) {
        mapping.types.push(match[1]);
      }
    }

    // Analyze TanStack Query file
    const queryFile = path.join(CONFIG.generatedDir, '@tanstack', 'angular-query-experimental.gen.ts');
    if (fs.existsSync(queryFile)) {
      const content = fs.readFileSync(queryFile, 'utf8');

      // Find queryOptions
      const optionsRegex = /export const (\w+Options) = /g;
      let match;
      while ((match = optionsRegex.exec(content)) !== null) {
        mapping.queryOptions.push(match[1]);
      }
    }
  } catch (error) {
    console.warn('Warning: Could not fully analyze generated code:', error.message);
  }

  return mapping;
}

/**
 * Create manual to generated mapping
 */
function createMappings() {
  return {
    services: {
      // Audits
      'AuditsService.getAllAuditsQuery': 'auditsGetAllAuditsOptions',
      'AuditsService.getAuditByIdQuery': 'auditsGetAuditByIdOptions',
      'AuditsService.searchAuditsQuery': 'auditsSearchAuditsOptions',
      'AuditsService.createAuditMutation': 'auditsCreateAuditMutation',
      'AuditsService.updateAuditMutation': 'auditsUpdateAuditMutation',
      'AuditsService.deleteAuditMutation': 'auditsDeleteAuditMutation',

      // Reference Audits
      'ReferenceAuditsService.getReferenceAuditsQuery': 'referenceAuditsGetReferenceAuditsOptions',
      'ReferenceAuditsService.getAuditByNumberQuery': 'referenceAuditsGetAuditByAuditNumberOptions',
      'ReferenceAuditsService.getAuditsBySupplierQuery': 'referenceAuditsGetAuditsBySupplierNumberOptions',
      'ReferenceAuditsService.auditExistsQuery': 'referenceAuditsAuditExistsOptions',

      // Suppliers
      'SuppliersService.getSuppliersQuery': 'referenceSuppliersGetAllSuppliersOptions',
      'SuppliersService.getSupplierQuery': 'referenceSuppliersGetSupplierByNumberOptions',
      'SuppliersService.searchSuppliersQuery': 'referenceSuppliersSearchSuppliersOptions',
      'SuppliersQueryService.createPaginatedQuery': 'referenceSuppliersGetAllSuppliersOptions',
      'SuppliersQueryService.createSupplierQuery': 'referenceSuppliersGetSupplierByNumberOptions',
      'SuppliersQueryService.createSearchQuery': 'referenceSuppliersSearchSuppliersOptions',
    },
    types: {
      'AuditResponse': 'AuditResponse',
      'AuditDetailsResponse': 'AuditDetailsResponse',
      'CreateAuditRequest': 'CreateAuditRequest',
      'UpdateAuditRequest': 'UpdateAuditRequest',
      'SupplierDetailsResponse': 'SupplierDetailsResponse',
      'PaginatedResponse': 'PaginatedResponseOfAuditResponse',
      'PaginationParams': '{ pageNumber?: number; pageSize?: number }',
    }
  };
}

/**
 * Generate migration plan
 */
function generateMigrationPlan(allFiles, mappings, generatedMapping) {
  const plan = {
    summary: {
      totalFiles: 0,
      componentsToMigrate: 0,
      servicesToRemove: 0,
      typesToReplace: 0,
      complexMigrations: 0,
    },
    files: [],
    warnings: [],
    customLogicFiles: [],
  };

  for (const fileAnalysis of allFiles) {
    if (fileAnalysis.modelsImports.length === 0 &&
        fileAnalysis.schemasImports.length === 0 &&
        fileAnalysis.servicesImports.length === 0) {
      continue; // Skip files with no manual imports
    }

    plan.summary.totalFiles++;

    const filePlan = {
      path: fileAnalysis.path,
      actions: [],
      complexity: 'simple',
    };

    // Handle model imports
    if (fileAnalysis.modelsImports.length > 0) {
      filePlan.actions.push({
        type: 'replace-import',
        from: '@core/api/models',
        to: '@core/api/generated',
        imports: fileAnalysis.modelsImports,
      });
      plan.summary.typesToReplace += fileAnalysis.modelsImports.length;
    }

    // Handle service imports
    if (fileAnalysis.servicesImports.length > 0) {
      for (const serviceImport of fileAnalysis.servicesImports) {
        filePlan.actions.push({
          type: 'replace-service',
          serviceName: serviceImport.serviceName,
          imports: serviceImport.imports,
        });

        if (fileAnalysis.path.includes('features/')) {
          plan.summary.componentsToMigrate++;
        }
      }
    }

    // Check for custom logic
    if (fileAnalysis.hasCustomLogic) {
      filePlan.complexity = 'complex';
      plan.summary.complexMigrations++;
      plan.customLogicFiles.push(fileAnalysis.path);
      plan.warnings.push({
        file: fileAnalysis.path,
        message: 'Contains custom transformation logic that needs manual review',
      });
    }

    plan.files.push(filePlan);
  }

  return plan;
}

/**
 * Main analysis
 */
function main() {
  console.log('🔍 Analyzing codebase for migration...\n');

  // Find all TypeScript files
  const allTsFiles = findTsFiles(CONFIG.srcDir);
  console.log(`Found ${allTsFiles.length} TypeScript files\n`);

  // Analyze each file
  const fileAnalyses = allTsFiles.map(analyzeFile);

  // Filter to files that need migration
  const filesToMigrate = fileAnalyses.filter(
    f => f.modelsImports.length > 0 ||
         f.schemasImports.length > 0 ||
         f.servicesImports.length > 0
  );

  console.log(`📊 Files requiring migration: ${filesToMigrate.length}\n`);

  // Analyze generated code
  console.log('📦 Analyzing generated code...');
  const generatedMapping = analyzeGeneratedCode();
  console.log(`   - ${generatedMapping.types.length} generated types`);
  console.log(`   - ${generatedMapping.queryOptions.length} query options\n`);

  // Create mappings
  const mappings = createMappings();

  // Generate migration plan
  const plan = generateMigrationPlan(filesToMigrate, mappings, generatedMapping);

  // Create output directory
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  // Write detailed plan
  const planFile = path.join(CONFIG.outputDir, 'migration-plan.json');
  fs.writeFileSync(planFile, JSON.stringify({
    plan,
    mappings,
    generatedMapping,
    filesToMigrate,
  }, null, 2));

  // Write human-readable report
  const reportFile = path.join(CONFIG.outputDir, 'migration-report.md');
  const report = generateReport(plan, filesToMigrate);
  fs.writeFileSync(reportFile, report);

  // Print summary
  console.log('📋 Migration Summary:');
  console.log(`   ✓ Total files to migrate: ${plan.summary.totalFiles}`);
  console.log(`   ✓ Components to update: ${plan.summary.componentsToMigrate}`);
  console.log(`   ✓ Types to replace: ${plan.summary.typesToReplace}`);
  console.log(`   ⚠ Complex migrations: ${plan.summary.complexMigrations}`);
  console.log(`\n📄 Full report: ${path.relative(projectRoot, reportFile)}`);
  console.log(`📄 Detailed plan: ${path.relative(projectRoot, planFile)}\n`);

  if (plan.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    plan.warnings.forEach(w => {
      console.log(`   - ${w.file}: ${w.message}`);
    });
    console.log('');
  }

  console.log('✅ Analysis complete!\n');
  console.log('Next steps:');
  console.log('  1. Review the migration report');
  console.log('  2. Run: node scripts/migrate-execute.js (to perform migration)');
  console.log('  3. Run: node scripts/migrate-validate.js (to validate changes)\n');
}

/**
 * Generate human-readable report
 */
function generateReport(plan, filesToMigrate) {
  let report = `# API Migration Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;

  report += `## Summary\n\n`;
  report += `- **Total files to migrate**: ${plan.summary.totalFiles}\n`;
  report += `- **Components to update**: ${plan.summary.componentsToMigrate}\n`;
  report += `- **Types to replace**: ${plan.summary.typesToReplace}\n`;
  report += `- **Complex migrations**: ${plan.summary.complexMigrations}\n\n`;

  report += `## Files Requiring Migration\n\n`;

  for (const file of plan.files) {
    report += `### ${file.path}\n\n`;
    report += `**Complexity**: ${file.complexity}\n\n`;
    report += `**Actions**:\n`;

    for (const action of file.actions) {
      if (action.type === 'replace-import') {
        report += `- Replace import from \`${action.from}\` to \`${action.to}\`\n`;
        report += `  - Imports: ${action.imports.join(', ')}\n`;
      } else if (action.type === 'replace-service') {
        report += `- Replace service: \`${action.serviceName}\`\n`;
        report += `  - Update methods: ${action.imports.join(', ')}\n`;
      }
    }

    report += `\n`;
  }

  if (plan.warnings.length > 0) {
    report += `## Warnings\n\n`;
    for (const warning of plan.warnings) {
      report += `- **${warning.file}**: ${warning.message}\n`;
    }
    report += `\n`;
  }

  report += `## Custom Logic Files\n\n`;
  report += `These files contain custom transformation logic and require manual review:\n\n`;
  for (const file of plan.customLogicFiles) {
    report += `- ${file}\n`;
  }

  report += `\n## Next Steps\n\n`;
  report += `1. Review this report carefully\n`;
  report += `2. Back up your codebase or create a git branch\n`;
  report += `3. Run the migration script: \`node scripts/migrate-execute.js\`\n`;
  report += `4. Test the migrated code thoroughly\n`;
  report += `5. Manually handle custom logic in complex files\n`;

  return report;
}

// Run the analysis
main();
