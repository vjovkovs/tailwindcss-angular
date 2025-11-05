#!/usr/bin/env node

/**
 * Cross-platform SSL certificate generation script
 * Detects the platform and runs the appropriate script
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const platform = process.platform;
const scriptDir = __dirname;
const certDir = path.join(scriptDir, '..', '.certs');

console.log('🔐 Generating SSL certificates for local development...\n');

// Check if certificates already exist
const certPath = path.join(certDir, 'localhost.pem');
const keyPath = path.join(certDir, 'localhost.key');

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  console.log('✅ SSL certificates already exist!');
  console.log(`📁 Location: ${certDir}`);
  console.log('\n💡 To regenerate certificates, delete the .certs directory and run this script again.\n');
  process.exit(0);
}

try {
  if (platform === 'win32') {
    // Windows - run PowerShell script
    const psScript = path.join(scriptDir, 'generate-ssl-cert.ps1');
    console.log('Detected Windows - using PowerShell script...\n');
    execSync(`powershell -ExecutionPolicy Bypass -File "${psScript}"`, { stdio: 'inherit' });
  } else {
    // Unix/Linux/macOS - run bash script
    const shScript = path.join(scriptDir, 'generate-ssl-cert.sh');
    console.log('Detected Unix/Linux/macOS - using bash script...\n');
    execSync(`bash "${shScript}"`, { stdio: 'inherit' });
  }
} catch (error) {
  console.error('\n❌ Failed to generate SSL certificates');
  console.error('Error:', error.message);
  console.error('\n📝 Manual setup:');
  console.error('   Run the appropriate script for your platform:');
  console.error(`   - Windows: powershell -ExecutionPolicy Bypass -File "${path.join(scriptDir, 'generate-ssl-cert.ps1')}"`);
  console.error(`   - Unix/Linux/macOS: bash "${path.join(scriptDir, 'generate-ssl-cert.sh')}"`);
  process.exit(1);
}
