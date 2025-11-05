const fs = require('fs');
const path = require('path');

const envDir = path.join(__dirname, '..', 'src', 'environments');
const envFiles = ['environment.ts', 'environment.prod.ts'];

const sensitivePatterns = [
  { pattern: /clientId:\s*'[^']*'/, replacement: "clientId: 'YOUR_CLIENT_ID'" },
  { pattern: /authority:\s*'[^']*'/, replacement: "authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID'" },
  { pattern: /appName:\s*'[^']*'/, replacement: "appName: 'YOUR_APP_NAME'" },
  { pattern: /companyName:\s*'[^']*'/, replacement: "companyName: 'YOUR_COMPANY_NAME'" }
];

envFiles.forEach(filename => {
  const filePath = path.join(envDir, filename);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    sensitivePatterns.forEach(({ pattern, replacement }) => {
      content = content.replace(pattern, replacement);
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Stripped sensitive data from ${filename}`);
  }
});