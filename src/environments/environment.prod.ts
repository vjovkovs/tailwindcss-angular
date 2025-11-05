export const environment = {
  production: true,
  apiUrl: '/api',

  // MSAL Configuration
  msal: {
    clientId: 'YOUR_PROD_CLIENT_ID_HERE', // Azure AD Application (client) ID
    authority: 'https://login.microsoftonline.com/YOUR_PROD_TENANT_ID_HERE', // Azure AD tenant ID or domain
    redirectUri: 'https://yourdomain.com', // Must match Azure AD redirect URI
    postLogoutRedirectUri: 'https://yourdomain.com',

    // Scopes for accessing APIs
    scopes: ['user.read'], // Default scopes for Microsoft Graph

    // Protected resources (APIs that require authentication)
    protectedResourceMap: new Map<string, string[]>([
      ['https://graph.microsoft.com/v1.0/me', ['user.read']],
      ['/api', ['api://YOUR_PROD_API_CLIENT_ID/access_as_user']], // Your backend API
    ]),
  },
};
