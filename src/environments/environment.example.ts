/**
 * Example Environment Configuration
 *
 * Copy this file to environment.ts and environment.prod.ts
 * and fill in your Azure AD configuration values.
 *
 * Azure AD Setup Instructions:
 * 1. Go to https://portal.azure.com
 * 2. Navigate to "Azure Active Directory" > "App registrations"
 * 3. Click "New registration"
 * 4. Fill in the application details:
 *    - Name: Your application name
 *    - Supported account types: Choose based on your needs
 *    - Redirect URI: http://localhost:4200 (for development)
 * 5. After registration, note down:
 *    - Application (client) ID -> use as clientId
 *    - Directory (tenant) ID -> use in authority URL
 * 6. Go to "Authentication" and add platform configurations:
 *    - Add "Single-page application" platform
 *    - Add redirect URIs (including localhost for dev)
 *    - Enable "ID tokens" under Implicit grant and hybrid flows
 * 7. Go to "API permissions" and add required permissions:
 *    - Microsoft Graph > Delegated > User.Read (usually added by default)
 *    - Add any additional API permissions your app needs
 * 8. If using your own backend API:
 *    - Create another app registration for your API
 *    - Expose an API scope (e.g., access_as_user)
 *    - Add that scope to protectedResourceMap
 */

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',

  // MSAL Configuration
  msal: {
    /**
     * Azure AD Application (client) ID
     * Found in: Azure Portal > App Registration > Overview
     * Example: '12345678-1234-1234-1234-123456789012'
     */
    clientId: 'YOUR_CLIENT_ID_HERE',

    /**
     * Azure AD Authority URL
     * Format: https://login.microsoftonline.com/{tenantId}
     * - Use tenant ID for single-tenant apps
     * - Use 'common' for multi-tenant apps
     * - Use 'organizations' for work/school accounts only
     * - Use 'consumers' for personal Microsoft accounts only
     *
     * Found in: Azure Portal > App Registration > Overview > Directory (tenant) ID
     * Example: 'https://login.microsoftonline.com/12345678-1234-1234-1234-123456789012'
     */
    authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID_HERE',

    /**
     * Redirect URI after login
     * Must match exactly what's configured in Azure Portal > App Registration > Authentication
     * For development, use: http://localhost:4200
     * For production, use your production URL
     */
    redirectUri: 'http://localhost:4200',

    /**
     * Redirect URI after logout
     * Where to send users after they log out
     */
    postLogoutRedirectUri: 'http://localhost:4200',

    /**
     * Default scopes to request on login
     * Common scopes:
     * - 'user.read' - Read user profile from Microsoft Graph
     * - 'openid' - OpenID Connect scope
     * - 'profile' - User profile information
     * - 'email' - User email address
     */
    scopes: ['user.read'],

    /**
     * Protected Resource Map
     * Maps API endpoints to the scopes required to access them
     *
     * Format: new Map<string, string[]>([
     *   ['{API_ENDPOINT}', ['{SCOPE_1}', '{SCOPE_2}']],
     * ])
     *
     * Example for Microsoft Graph:
     * ['https://graph.microsoft.com/v1.0/me', ['user.read']]
     *
     * Example for your own API:
     * ['https://api.yourdomain.com', ['api://YOUR_API_CLIENT_ID/access_as_user']]
     *
     * The interceptor will automatically add access tokens to requests matching these URLs
     */
    protectedResourceMap: new Map<string, string[]>([
      // Microsoft Graph API
      ['https://graph.microsoft.com/v1.0/me', ['user.read']],

      // Your backend API (replace with your actual API URL and scope)
      ['http://localhost:3000/api', ['api://YOUR_API_CLIENT_ID/access_as_user']],
    ]),
  },
};
