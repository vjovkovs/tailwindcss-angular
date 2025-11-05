export const environment = {
  production: true,
  appName: 'NUPIC Document Management',
  companyName: 'NUPIC',
  baseUrl: '/', // Change this to the address of your backend API if different from frontend address
  apiUrl: '/api',

  // MSAL Configuration
  msal: {
    clientId: '9c097f4f-fe4c-4035-abe9-2b41caaf983c', // Azure AD Application (client) ID
    authority: 'https://login.microsoftonline.com/a59f659e-5ea2-4277-9acc-914bdc19f725', // Azure AD tenant ID or domain
    redirectUri: 'https://yourdomain.com', // Must match Azure AD redirect URI
    postLogoutRedirectUri: 'https://yourdomain.com',

    // Scopes for accessing APIs
    scopes: ['User.Read', 'profile', 'email', 'openid'], // Default scopes for Microsoft Graph

    // Protected resources (APIs that require authentication)
    protectedResourceMap: new Map<string, string[]>([
      ['https://graph.microsoft.com/v1.0/me', ['user.read']],
      ['/api', ['api://9c097f4f-fe4c-4035-abe9-2b41caaf983c/access_as_user']], // Your backend API
    ]),
  },
};
