#!/usr/bin/env node

/**
 * Cleanup Manual Code Script
 *
 * Safely removes manual API code that is no longer used after migration.
 * Creates backups before deletion.
 *
 * Usage:
 *   node scripts/cleanup-manual-code.js --dry-run    # Preview what will be deleted
 *   node scripts/cleanup-manual-code.js              # Execute cleanup
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

// Configuration
const CONFIG = {
  backupDir: path.join(projectRoot, '.migration/deleted-backup'),
  filesToRemove: [
    'src/app/core/api/models/index.ts',
    'src/app/core/api/schemas/index.ts',
    'src/app/core/api/services/audits.service.ts',
    'src/app/core/api/services/suppliers.service.ts',
    'src/app/core/api/services/suppliers-query.service.ts',
    'src/app/core/api/services/reference-audits.service.ts',
    'src/app/core/api/services/audit-files.service.ts',
    'src/app/core/api/services/phase-assignments.service.ts',
    'src/app/core/api/services/document-bookmarks.service.ts',
    'src/app/core/api/services/nupic-audits.service.ts',
  ],
  // Keep base-api.service.ts as it may have utility methods
  filesToKeep: [
    'src/app/core/api/services/base-api.service.ts',
  ],
};

/**
 * Create backup of a file before deletion
 */
function backupFile(filePath) {
  const relativePath = path.relative(projectRoot, filePath);
  const backupPath = path.join(CONFIG.backupDir, relativePath);
  const backupDir = path.dirname(backupPath);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

/**
 * Check if a file is imported anywhere
 */
function isFileImported(filePath, allFiles) {
  const fileName = path.basename(filePath, '.ts');
  const fileDir = path.dirname(filePath);

  for (const file of allFiles) {
    if (file === filePath) continue; // Skip the file itself

    const content = fs.readFileSync(file, 'utf8');

    // Check for imports by file name
    if (content.includes(fileName)) {
      return true;
    }

    // Check for imports by path
    const relativePath = path.relative(path.dirname(file), filePath);
    if (content.includes(relativePath.replace('.ts', ''))) {
      return true;
    }
  }

  return false;
}

/**
 * Find all TypeScript files
 */
function findAllTsFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && !entry.name.includes('node_modules')) {
      findAllTsFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Main cleanup
 */
function main() {
  console.log('🧹 Manual Code Cleanup\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be deleted\n');
  }

  // Find all TypeScript files
  const allFiles = findAllTsFiles(path.join(projectRoot, 'src'));

  const toRemove = [];
  const stillUsed = [];
  const notFound = [];

  // Check each file
  for (const fileToRemove of CONFIG.filesToRemove) {
    const fullPath = path.join(projectRoot, fileToRemove);

    if (!fs.existsSync(fullPath)) {
      notFound.push(fileToRemove);
      continue;
    }

    if (isFileImported(fullPath, allFiles)) {
      stillUsed.push(fileToRemove);
    } else {
      toRemove.push(fileToRemove);
    }
  }

  // Print results
  if (stillUsed.length > 0) {
    console.log('⚠️  Still in use (will NOT delete):\n');
    for (const file of stillUsed) {
      console.log(`   - ${file}`);
    }
    console.log('');
  }

  if (notFound.length > 0) {
    console.log('ℹ️  Not found (already deleted?):\n');
    for (const file of notFound) {
      console.log(`   - ${file}`);
    }
    console.log('');
  }

  if (toRemove.length === 0) {
    console.log('✅ No files to remove. Manual code is still in use or already cleaned up.\n');
    return;
  }

  console.log(`🗑️  Files to remove (${toRemove.length}):\n`);
  for (const file of toRemove) {
    console.log(`   - ${file}`);
  }
  console.log('');

  if (!dryRun) {
    console.log('📦 Creating backups and removing files...\n');

    for (const fileToRemove of toRemove) {
      const fullPath = path.join(projectRoot, fileToRemove);

      // Create backup
      const backupPath = backupFile(fullPath);
      console.log(`   💾 Backed up: ${fileToRemove}`);

      // Delete file
      fs.unlinkSync(fullPath);
      console.log(`   🗑️  Deleted: ${fileToRemove}`);
    }

    console.log('');
    console.log(`✅ Cleanup complete!`);
    console.log(`📦 Backups saved to: ${path.relative(projectRoot, CONFIG.backupDir)}\n`);

    // Check if directories are empty and can be removed
    const dirsToCheck = [
      path.join(projectRoot, 'src/app/core/api/models'),
      path.join(projectRoot, 'src/app/core/api/schemas'),
    ];

    for (const dir of dirsToCheck) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        if (files.length === 0) {
          fs.rmdirSync(dir);
          console.log(`   🗑️  Removed empty directory: ${path.relative(projectRoot, dir)}`);
        }
      }
    }

    console.log('');
  } else {
    console.log('💡 This was a dry run. Run without --dry-run to delete files.\n');
  }
}

// Run cleanup
main();
