const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sslDir = path.join(__dirname, '..', '.certs');
const certPath = path.join(sslDir, 'localhost.crt');
const keyPath = path.join(sslDir, 'localhost.key');

// Create ssl directory if it doesn't exist
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
}

// Check if certificates already exist
if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  console.log('✅ SSL certificates already exist');
  return;
}

console.log('🔐 Generating SSL certificates...');

try {
  // Try to use OpenSSL first
  try {
    execSync(`openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`, 
      { stdio: 'inherit' });
    console.log('✅ SSL certificates generated using OpenSSL');
  } catch (opensslError) {
    // Fallback: Generate basic certificates using Node.js
    console.log('⚠️  OpenSSL not found, generating basic certificates...');
    
    const selfsigned = require('selfsigned');
    const attrs = [{ name: 'commonName', value: 'localhost' }];
    const pems = selfsigned.generate(attrs, { days: 365 });
    
    fs.writeFileSync(keyPath, pems.private);
    fs.writeFileSync(certPath, pems.cert);
    console.log('✅ SSL certificates generated using Node.js fallback');
  }
} catch (error) {
  console.error('❌ Failed to generate SSL certificates:', error.message);
  console.log('📝 You may need to install OpenSSL or generate certificates manually');
}