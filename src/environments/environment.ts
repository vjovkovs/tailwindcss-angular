export const environment = {
  production: false,
  appName: 'NUPIC Document Management',
  companyName: 'NUPIC',
  baseUrl: 'https://localhost:5001', // Change this to the address of your backend API if different from frontend address
  apiUrl: 'https://localhost:5001/api', // Change this to the address of your backend API if different from frontend address

  // MSAL Configuration
  msal: {
    clientId: '9c097f4f-fe4c-4035-abe9-2b41caaf983c', // This is the ONLY mandatory field that you need to supply.
    authority: 'https://login.microsoftonline.com/a59f659e-5ea2-4277-9acc-914bdc19f725', // Defaults to "https://login.microsoftonline.com/common"
    redirectUri: '/auth', // Points to window.location.origin by default. You must register this URI on Azure portal/App Registration.
    postLogoutRedirectUri: '/', // Points to window.location.origin by default.
    
    // Scopes for accessing APIs
    scopes: ['User.Read', 'profile', 'email', 'openid'], // Default scopes for Microsoft Graph

    // Protected resources (APIs that require authentication)
    protectedResourceMap: new Map<string, string[]>([
      ['https://graph.microsoft.com/v1.0/me', ['User.Read']],
      ['http://localhost:3000/api', ['api://9c097f4f-fe4c-4035-abe9-2b41caaf983c/access_as_user']], // Your backend API
    ]),
  },
};
