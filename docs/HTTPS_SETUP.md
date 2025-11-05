# HTTPS Development Setup Guide

This guide explains how to set up HTTPS for local development. HTTPS is required for certain features like MSAL authentication with Azure AD, secure cookies, and service workers.

## Quick Start

From a fresh clone of the repository, follow these steps:

```bash
# 1. Install dependencies
npm install

# 2. Generate SSL certificates
npm run ssl:generate

# 3. Start the development server with HTTPS
npm run start:https
```

The application will be available at: `https://localhost:4200`

## Why HTTPS for Local Development?

HTTPS is required for:
- **MSAL Authentication**: Azure AD requires HTTPS for redirect URIs (except http://localhost)
- **Secure Cookies**: HTTPOnly and Secure cookie flags require HTTPS
- **Service Workers**: Modern browsers require HTTPS for service worker registration
- **Web APIs**: Some browser APIs (geolocation, camera, etc.) require secure contexts
- **Production Parity**: Developing with HTTPS matches your production environment

## Certificate Generation

### Automated Setup (Recommended)

Run the certificate generation script:

```bash
npm run ssl:generate
```

This script will:
1. Detect your operating system (Windows, macOS, Linux)
2. Run the appropriate certificate generation script
3. Create a `.certs` directory with:
   - `localhost.pem` - SSL certificate
   - `localhost.key` - Private key
4. Generate certificates valid for 365 days

### Manual Setup

If the automated script doesn't work, you can generate certificates manually:

#### On Unix/Linux/macOS:

```bash
bash scripts/generate-ssl-cert.sh
```

#### On Windows:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/generate-ssl-cert.ps1
```

#### Using OpenSSL Directly:

```bash
# Create .certs directory
mkdir -p .certs

# Generate private key
openssl genrsa -out .certs/localhost.key 2048

# Generate certificate
openssl req -new -x509 -key .certs/localhost.key -out .certs/localhost.pem -days 365 \
  -subj "/C=US/ST=State/L=City/O=Organization/OU=Dev/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:127.0.0.1,IP:127.0.0.1"
```

## Starting the Development Server

### With HTTPS (Recommended):

```bash
npm run start:https
```

Access the application at: `https://localhost:4200`

### With HTTP (Standard):

```bash
npm start
# or
npm run dev
```

Access the application at: `http://localhost:4200`

## Browser Certificate Warnings

Self-signed certificates will trigger browser security warnings. This is expected and safe for local development.

### Chrome/Edge

1. You'll see "Your connection is not private"
2. Click **Advanced**
3. Click **Proceed to localhost (unsafe)**

### Firefox

1. You'll see "Warning: Potential Security Risk Ahead"
2. Click **Advanced**
3. Click **Accept the Risk and Continue**

### Safari

1. You'll see "This Connection Is Not Private"
2. Click **Show Details**
3. Click **visit this website**
4. Confirm by clicking **Visit Website**

### Trust Certificate (Optional)

To avoid warnings every time, you can trust the certificate:

#### macOS:
```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain .certs/localhost.pem
```

#### Windows:
```powershell
Import-Certificate -FilePath .\.certs\localhost.pem -CertStoreLocation Cert:\CurrentUser\Root
```

#### Linux (Chrome/Chromium):
```bash
certutil -d sql:$HOME/.pki/nssdb -A -t "P,," -n "localhost" -i .certs/localhost.pem
```

## Azure AD Configuration

When using MSAL authentication, you must configure Azure AD with HTTPS redirect URIs:

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Select your application
4. Go to **Authentication**
5. Add redirect URI: `https://localhost:4200`
6. Save the configuration

Update your `src/environments/environment.ts`:

```typescript
redirectUri: 'https://localhost:4200',
postLogoutRedirectUri: 'https://localhost:4200',
```

## Troubleshooting

### Error: "ELIFECYCLE Command failed with exit code 1"

This error can occur with certain Node.js versions and Angular CLI. The solution provided in this repository uses Angular CLI's built-in SSL support with local certificates.

**Solution:**
- Ensure you've generated certificates: `npm run ssl:generate`
- Check that `.certs/localhost.pem` and `.certs/localhost.key` exist
- Try deleting `.certs` and regenerating certificates

### Error: "Cannot find module 'openssl'"

OpenSSL is not installed on your system.

**Solution:**
- **Windows**: Install OpenSSL from [slproweb.com/products/Win32OpenSSL.html](https://slproweb.com/products/Win32OpenSSL.html)
- **macOS**: OpenSSL is usually pre-installed. If not: `brew install openssl`
- **Linux**: `sudo apt-get install openssl` (Debian/Ubuntu) or `sudo yum install openssl` (RHEL/CentOS)

### Certificates Expired

Self-signed certificates are valid for 365 days. To regenerate:

```bash
# Delete old certificates
rm -rf .certs

# Generate new certificates
npm run ssl:generate
```

### Port Already in Use

If port 4200 is already in use:

```bash
# Use a different port
ng serve --ssl --ssl-cert .certs/localhost.pem --ssl-key .certs/localhost.key --port 4201
```

Update your Azure AD redirect URI accordingly (e.g., `https://localhost:4201`).

## Certificate Storage

- Certificates are stored in `.certs/` directory
- This directory is gitignored and will not be committed
- Each developer generates their own certificates locally
- Certificates are valid for the local machine only

## Production Deployment

For production deployments:
- Use proper SSL certificates from a Certificate Authority (Let's Encrypt, Digicert, etc.)
- Configure your hosting provider's SSL/TLS settings
- Update `src/environments/environment.prod.ts` with production URLs
- Update Azure AD with production redirect URIs

## Security Notes

- **Never commit** SSL certificates to version control
- Self-signed certificates are **only for local development**
- Production must use certificates from trusted Certificate Authorities
- Keep your private keys secure and never share them
- Regenerate certificates if compromised

## Additional Resources

- [Angular CLI SSL Documentation](https://angular.dev/tools/cli/serve)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [OpenSSL Documentation](https://www.openssl.org/docs/)
- [Let's Encrypt (Free SSL Certificates)](https://letsencrypt.org/)

## Support

If you encounter issues not covered in this guide:
1. Check that Node.js and npm are up to date
2. Verify OpenSSL is installed and accessible
3. Review Angular CLI documentation for your version
4. Check browser console for specific error messages
