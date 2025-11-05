const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envDir = path.join(__dirname, '..', 'src', 'environments');
const templatePath = path.join(envDir, 'environment.template.ts');
const envPath = path.join(envDir, 'environment.ts');

console.log('🔧 Setting up environment configuration...\n');

if (fs.existsSync(envPath)) {
  console.log('✅ Environment file already exists!');
  process.exit(0);
}

if (!fs.existsSync(templatePath)) {
  console.error('❌ Template file not found!');
  process.exit(1);
}

const questions = [
  { key: 'YOUR_APP_NAME', prompt: 'Enter your app name: ', default: 'My Angular App' },
  { key: 'YOUR_COMPANY_NAME', prompt: 'Enter your company name: ', default: 'My Company' },
  { key: 'YOUR_CLIENT_ID', prompt: 'Enter your Azure AD Client ID: ', default: '' },
  { key: 'YOUR_TENANT_ID', prompt: 'Enter your Azure AD Tenant ID: ', default: 'common' }
];

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(`${question.prompt}${question.default ? `(${question.default}) ` : ''}`, (answer) => {
      resolve(answer.trim() || question.default);
    });
  });
}

async function setupEnvironment() {
  const answers = {};
  
  for (const question of questions) {
    answers[question.key] = await askQuestion(question);
  }
  
  let envContent = fs.readFileSync(templatePath, 'utf8');
  
  // Replace placeholders with actual values
  Object.entries(answers).forEach(([key, value]) => {
    envContent = envContent.replace(new RegExp(key, 'g'), value);
  });
  
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Environment file created successfully!');
  console.log('📍 Location:', envPath);
  console.log('\n⚠️  Remember: This file contains sensitive information and is ignored by Git.');
  
  rl.close();
}

setupEnvironment().catch(console.error);