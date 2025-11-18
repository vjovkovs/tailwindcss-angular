export const environment = {
  production: false,
  appName: 'NUPIC Document Manager',
  companyName: 'YOUR_COMPANY_NAME',

  // NUPIC API Configuration
  baseUrl: 'https://localhost:53928',
  apiUrl: 'https://localhost:53928/api',

  // MSAL Configuration
  msal: {
    // Azure AD Application Client ID
    clientId: '9c097f4f-fe4c-4035-abe9-2b41caaf983c',

    // Azure AD Tenant
    authority: 'https://login.microsoftonline.com/a59f659e-5ea2-4277-9acc-914bdc19f725',

    // Redirect URIs
    redirectUri: '/auth', // Must be registered in Azure portal
    postLogoutRedirectUri: '/', // Redirect after logout

    // Scopes for accessing APIs (used for login and SSO)
    scopes: [
      'api://9c097f4f-fe4c-4035-abe9-2b41caaf983c/access_as_user',
      'User.Read',
      'profile',
      'email',
      'openid'
    ],

    // Protected resources configuration (used by MSAL interceptor)
    protectedResources: {
      api: {
        endpoint: 'https://localhost:53928/api',
        scopes: {
          read: ['api://9c097f4f-fe4c-4035-abe9-2b41caaf983c/access_as_user'],
          write: ['api://9c097f4f-fe4c-4035-abe9-2b41caaf983c/access_as_user'],
        },
      },
    },
  },
};