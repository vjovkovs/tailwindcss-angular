export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',

  // MSAL Configuration
  msal: {
    clientId: 'YOUR_CLIENT_ID_HERE', // Azure AD Application (client) ID
    authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID_HERE', // Azure AD tenant ID or domain
    redirectUri: 'http://localhost:4200', // Must match Azure AD redirect URI
    postLogoutRedirectUri: 'http://localhost:4200',

    // Scopes for accessing APIs
    scopes: ['user.read'], // Default scopes for Microsoft Graph

    // Protected resources (APIs that require authentication)
    protectedResourceMap: new Map<string, string[]>([
      ['https://graph.microsoft.com/v1.0/me', ['user.read']],
      ['http://localhost:3000/api', ['api://YOUR_API_CLIENT_ID/access_as_user']], // Your backend API
    ]),
  },
};
