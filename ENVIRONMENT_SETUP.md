# Environment Configuration

This project uses environment templates to keep sensitive configuration out of Git.

## First Time Setup

1. **Install dependencies**: `npm install`
2. **Setup environment**: The `postinstall` script will automatically create your environment file from the template
3. **Update configuration**: Edit `src/environments/environment.ts` with your actual values:
   - Replace `YOUR_APP_NAME` with your application name
   - Replace `YOUR_COMPANY_NAME` with your company name  
   - Replace `YOUR_CLIENT_ID` with your Azure AD Application Client ID
   - Replace `YOUR_TENANT_ID` with your Azure AD Tenant ID

## Manual Setup

If you need to recreate the environment file:

```bash
npm run setup:env
```

## Important Notes

- ✅ `environment.template.ts` files are tracked in Git
- ❌ `environment.ts` and `environment.prod.ts` are **NOT** tracked in Git
- 🔒 Your actual environment files contain sensitive information and should never be committed
- 📝 Always update the template files when adding new configuration options