export const environment = {
  production: false,
  appName: 'YOUR_APP_NAME',
  companyName: 'YOUR_COMPANY_NAME',
  baseUrl: 'https://localhost:5001', // Change this to the address of your backend API
  apiUrl: 'https://localhost:5001/api', // Change this to the address of your backend API

  // MSAL Configuration
  msal: {
    clientId: 'YOUR_CLIENT_ID', // Get from Azure App Registration
    authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID', // Your Azure AD tenant
    redirectUri: '/auth', // Must be registered in Azure portal
    postLogoutRedirectUri: '/', // Redirect after logout
    
    // Scopes for accessing APIs
    scopes: ['User.Read', 'profile', 'email', 'openid'],

    // Protected resources (APIs that require authentication)
    protectedResourceMap: new Map<string, string[]>([
      ['https://graph.microsoft.com/v1.0/me', ['User.Read']],
      ['http://localhost:3000/api', ['api://YOUR_CLIENT_ID/access_as_user']] // Your backend API
    ]),
  },
};