#!/usr/bin/env node

/**
 * Migration Validation Script
 *
 * Validates that the migration was successful by checking:
 * - No remaining manual imports
 * - TypeScript compilation succeeds
 * - All generated imports are valid
 * - No broken references
 *
 * Usage: node scripts/migrate-validate.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Configuration
const CONFIG = {
  srcDir: path.join(projectRoot, 'src/app'),
  generatedDir: path.join(projectRoot, 'src/app/core/api/generated'),
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
 * Check for remaining manual imports
 */
function checkManualImports() {
  console.log('🔍 Checking for remaining manual imports...\n');

  const files = findTsFiles(CONFIG.srcDir);
  const issues = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(projectRoot, file);

    // Check for imports from manual models
    if (content.match(/from\s+['"](\.\.\/)*core\/api\/models['"]/)) {
      issues.push({
        file: relativePath,
        type: 'manual-model-import',
        message: 'Still imports from manual models',
      });
    }

    // Check for imports from manual schemas
    if (content.match(/from\s+['"](\.\.\/)*core\/api\/schemas['"]/)) {
      issues.push({
        file: relativePath,
        type: 'manual-schema-import',
        message: 'Still imports from manual schemas',
      });
    }

    // Check for imports from manual services (excluding the manual service files themselves)
    if (content.match(/from\s+['"](\.\.\/)*core\/api\/services\//)) {
      if (!file.includes('core/api/services')) {
        issues.push({
          file: relativePath,
          type: 'manual-service-import',
          message: 'Still imports from manual services',
        });
      }
    }
  }

  if (issues.length === 0) {
    console.log('   ✅ No manual imports found\n');
    return { success: true, issues: [] };
  }

  console.log(`   ❌ Found ${issues.length} files with manual imports:\n`);
  for (const issue of issues) {
    console.log(`     - ${issue.file}: ${issue.message}`);
  }
  console.log('');

  return { success: false, issues };
}

/**
 * Check for broken generated imports
 */
function checkGeneratedImports() {
  console.log('🔍 Checking generated imports...\n');

  const files = findTsFiles(CONFIG.srcDir);
  const issues = [];

  // Get list of available exports from generated code
  const generatedExports = new Set();
  const generatedFiles = [
    'types.gen.ts',
    'zod.gen.ts',
    'sdk.gen.ts',
    '@tanstack/angular-query-experimental.gen.ts',
  ];

  for (const genFile of generatedFiles) {
    const genPath = path.join(CONFIG.generatedDir, genFile);
    if (fs.existsSync(genPath)) {
      const content = fs.readFileSync(genPath, 'utf8');
      const exportMatches = content.matchAll(/export\s+(const|type|interface|class)\s+(\w+)/g);
      for (const match of exportMatches) {
        generatedExports.add(match[2]);
      }
    }
  }

  console.log(`   Found ${generatedExports.size} exported items in generated code\n`);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(projectRoot, file);

    // Find all imports from generated code
    const generatedImportRegex = /import\s+(?:type\s+)?{([^}]+)}\s+from\s+['"]@\/core\/api\/generated['"]/g;
    let match;

    while ((match = generatedImportRegex.exec(content)) !== null) {
      const imports = match[1].split(',').map(i => i.trim());

      for (const imp of imports) {
        // Handle aliased imports
        const importName = imp.includes(' as ') ? imp.split(' as ')[0].trim() : imp;

        if (!generatedExports.has(importName)) {
          issues.push({
            file: relativePath,
            type: 'invalid-import',
            message: `Imports non-existent '${importName}' from generated code`,
          });
        }
      }
    }
  }

  if (issues.length === 0) {
    console.log('   ✅ All generated imports are valid\n');
    return { success: true, issues: [] };
  }

  console.log(`   ❌ Found ${issues.length} invalid imports:\n`);
  for (const issue of issues) {
    console.log(`     - ${issue.file}: ${issue.message}`);
  }
  console.log('');

  return { success: false, issues };
}

/**
 * Run TypeScript compilation check
 */
async function checkTypeScriptCompilation() {
  console.log('🔍 Checking TypeScript compilation...\n');

  try {
    // Run tsc in noEmit mode to check for errors
    const { stdout, stderr } = await execAsync('npx tsc --noEmit', {
      cwd: projectRoot,
      timeout: 60000, // 60 second timeout
    });

    console.log('   ✅ TypeScript compilation successful\n');
    return { success: true, output: stdout };
  } catch (error) {
    console.log('   ❌ TypeScript compilation failed:\n');
    console.log(error.stdout || error.message);
    console.log('');

    return { success: false, output: error.stdout || error.message };
  }
}

/**
 * Check for unused manual code that can be deleted
 */
function checkUnusedManualCode() {
  console.log('🔍 Checking for unused manual code...\n');

  const files = findTsFiles(CONFIG.srcDir);
  const manualFiles = {
    models: path.join(projectRoot, 'src/app/core/api/models/index.ts'),
    schemas: path.join(projectRoot, 'src/app/core/api/schemas/index.ts'),
    services: [],
  };

  // Find all manual service files
  const servicesDir = path.join(projectRoot, 'src/app/core/api/services');
  if (fs.existsSync(servicesDir)) {
    const serviceFiles = fs.readdirSync(servicesDir).filter(f => f.endsWith('.ts'));
    manualFiles.services = serviceFiles.map(f => path.join(servicesDir, f));
  }

  const unusedFiles = [];

  // Check if models file is still imported anywhere
  const modelsImported = files.some(file => {
    const content = fs.readFileSync(file, 'utf8');
    return content.match(/from\s+['"](\.\.\/)*core\/api\/models['"]/);
  });

  if (!modelsImported && fs.existsSync(manualFiles.models)) {
    unusedFiles.push({ file: 'src/app/core/api/models/index.ts', type: 'models' });
  }

  // Check if schemas file is still imported anywhere
  const schemasImported = files.some(file => {
    const content = fs.readFileSync(file, 'utf8');
    return content.match(/from\s+['"](\.\.\/)*core\/api\/schemas['"]/);
  });

  if (!schemasImported && fs.existsSync(manualFiles.schemas)) {
    unusedFiles.push({ file: 'src/app/core/api/schemas/index.ts', type: 'schemas' });
  }

  // Check each service file
  for (const serviceFile of manualFiles.services) {
    const serviceName = path.basename(serviceFile);
    const serviceImported = files.some(file => {
      if (file === serviceFile) return false; // Don't check the file itself
      const content = fs.readFileSync(file, 'utf8');
      return content.includes(serviceName);
    });

    if (!serviceImported) {
      unusedFiles.push({
        file: path.relative(projectRoot, serviceFile),
        type: 'service',
      });
    }
  }

  if (unusedFiles.length === 0) {
    console.log('   ℹ️  Manual code still in use or already removed\n');
    return { files: [] };
  }

  console.log(`   📦 Found ${unusedFiles.length} unused manual files that can be removed:\n`);
  for (const unused of unusedFiles) {
    console.log(`     - ${unused.file} (${unused.type})`);
  }
  console.log('\n   💡 Run: node scripts/cleanup-manual-code.js to remove them\n');

  return { files: unusedFiles };
}

/**
 * Generate validation report
 */
function generateReport(results) {
  const report = [];

  report.push('# Migration Validation Report\n');
  report.push(`Generated: ${new Date().toISOString()}\n\n`);

  report.push('## Summary\n\n');

  const allPassed = Object.values(results).every(r => r.success !== false);

  if (allPassed) {
    report.push('✅ **All validation checks passed!**\n\n');
  } else {
    report.push('❌ **Some validation checks failed**\n\n');
  }

  report.push('## Validation Results\n\n');

  // Manual imports check
  if (results.manualImports) {
    report.push('### Manual Imports Check\n\n');
    if (results.manualImports.success) {
      report.push('✅ No manual imports found\n\n');
    } else {
      report.push(`❌ Found ${results.manualImports.issues.length} files with manual imports:\n\n`);
      for (const issue of results.manualImports.issues) {
        report.push(`- \`${issue.file}\`: ${issue.message}\n`);
      }
      report.push('\n');
    }
  }

  // Generated imports check
  if (results.generatedImports) {
    report.push('### Generated Imports Check\n\n');
    if (results.generatedImports.success) {
      report.push('✅ All generated imports are valid\n\n');
    } else {
      report.push(`❌ Found ${results.generatedImports.issues.length} invalid imports:\n\n`);
      for (const issue of results.generatedImports.issues) {
        report.push(`- \`${issue.file}\`: ${issue.message}\n`);
      }
      report.push('\n');
    }
  }

  // TypeScript compilation check
  if (results.compilation) {
    report.push('### TypeScript Compilation Check\n\n');
    if (results.compilation.success) {
      report.push('✅ TypeScript compilation successful\n\n');
    } else {
      report.push('❌ TypeScript compilation failed\n\n');
      report.push('```\n');
      report.push(results.compilation.output);
      report.push('\n```\n\n');
    }
  }

  // Unused code check
  if (results.unusedCode && results.unusedCode.files.length > 0) {
    report.push('### Unused Manual Code\n\n');
    report.push('The following manual files are no longer used and can be removed:\n\n');
    for (const file of results.unusedCode.files) {
      report.push(`- ${file.file}\n`);
    }
    report.push('\n');
  }

  report.push('## Next Steps\n\n');

  if (allPassed) {
    report.push('1. Review the changes in your application\n');
    report.push('2. Run your test suite: `npm test`\n');
    report.push('3. Manually test critical user flows\n');
    report.push('4. Remove unused manual code if validation passes\n');
    report.push('5. Commit the changes\n');
  } else {
    report.push('1. Fix the validation errors listed above\n');
    report.push('2. Re-run migration if needed: `node scripts/migrate-execute.js`\n');
    report.push('3. Re-run validation: `node scripts/migrate-validate.js`\n');
  }

  return report.join('');
}

/**
 * Main validation
 */
async function main() {
  console.log('🔬 Migration Validation\n');
  console.log('='.repeat(60) + '\n');

  const results = {};

  // Run all validation checks
  results.manualImports = checkManualImports();
  results.generatedImports = checkGeneratedImports();
  results.compilation = await checkTypeScriptCompilation();
  results.unusedCode = checkUnusedManualCode();

  console.log('='.repeat(60) + '\n');

  // Generate and save report
  const report = generateReport(results);
  const reportPath = path.join(projectRoot, '.migration/validation-report.md');
  fs.writeFileSync(reportPath, report);

  console.log(`📄 Validation report saved: ${path.relative(projectRoot, reportPath)}\n`);

  // Print summary
  const allPassed = Object.values(results).every(r => r.success !== false);

  if (allPassed) {
    console.log('✅ All validation checks passed!\n');
    console.log('Next steps:');
    console.log('  1. Run tests: npm test');
    console.log('  2. Test your application manually');
    console.log('  3. Review changes: git diff');
    console.log('  4. Commit if everything works\n');
  } else {
    console.log('❌ Some validation checks failed\n');
    console.log('Please review the issues above and fix them before proceeding.\n');
    process.exit(1);
  }
}

// Run validation
main();
