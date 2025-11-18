# .NET Core 9 Backend Authentication Setup for MSAL

This guide explains how to configure your .NET Core 9 backend to accept bearer tokens from your Angular MSAL frontend.

## Required NuGet Packages

```bash
dotnet add package Microsoft.Identity.Web
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
```

## Configuration in Program.cs

```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Identity.Web;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();

// Configure CORS (CRITICAL for allowing Authorization header)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200") // Your Angular dev server
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Important for authentication
    });
});

// Configure Azure AD JWT Bearer Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// IMPORTANT: CORS must come before Authentication/Authorization
app.UseCors("AllowAngularApp");

app.UseAuthentication(); // Must come before UseAuthorization
app.UseAuthorization();

app.MapControllers();

app.Run();
```

## Configuration in appsettings.json

```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "a59f659e-5ea2-4277-9acc-914bdc19f725",
    "ClientId": "9c097f4f-fe4c-4035-abe9-2b41caaf983c",
    "Audience": "api://9c097f4f-fe4c-4035-abe9-2b41caaf983c"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.Identity": "Information"
    }
  }
}
```

**Note**: The TenantId and ClientId above match your Angular environment.template.ts. Make sure these values match your Azure AD app registration.

## Azure AD App Registration Requirements

In the Azure Portal (https://portal.azure.com), ensure your app registration has:

### 1. Expose an API
- Add scope: `access_as_user`
- Full scope name should be: `api://9c097f4f-fe4c-4035-abe9-2b41caaf983c/access_as_user`

### 2. API Permissions
- Microsoft Graph → User.Read (Delegated)
- Your API → access_as_user (Delegated)

### 3. Authentication
- Platform: Single-page application (SPA)
- Redirect URIs: `http://localhost:4200/auth`
- Implicit grant: Enable "ID tokens"

### 4. Token Configuration (Optional)
- Add optional claims if needed (email, name, etc.)

## Controller Example

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace YourApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExampleController : ControllerBase
{
    [HttpGet]
    [Authorize] // This will now work!
    public IActionResult Get()
    {
        // Get the authenticated user's name
        var userName = User.Identity?.Name;
        var userId = User.FindFirst("oid")?.Value; // Object ID from Azure AD

        return Ok(new {
            message = "Authenticated successfully!",
            user = userName,
            userId = userId
        });
    }

    [HttpGet("public")]
    public IActionResult GetPublic()
    {
        return Ok(new { message = "This endpoint doesn't require authentication" });
    }
}
```

## Common Issues & Solutions

### Issue 1: Still getting 401 Unauthorized
**Check:**
- Browser DevTools → Network tab → Verify the request includes `Authorization: Bearer <token>` header
- If header is missing, the Angular interceptor isn't working (frontend issue)
- If header is present, check backend logs for JWT validation errors

### Issue 2: CORS errors
**Solution:**
- Ensure `app.UseCors()` comes BEFORE `app.UseAuthentication()` and `app.UseAuthorization()`
- Verify Angular app URL matches CORS policy origin exactly
- For production, update CORS to allow your production domain

### Issue 3: Token validation fails
**Check:**
- TenantId and ClientId in appsettings.json match your Azure AD app registration
- The Audience matches your API's Application ID URI (`api://<clientId>`)
- Your Azure AD app has "Expose an API" configured correctly

### Issue 4: Token expired or invalid
**Solution:**
- Tokens expire after 1 hour by default
- MSAL should automatically refresh tokens
- Check browser console for MSAL errors

## Testing the Setup

### 1. Test without [Authorize] first
Remove `[Authorize]` from a controller endpoint and verify you can call it successfully.

### 2. Add [Authorize] and test
Add `[Authorize]` back and verify:
- You get 401 if not logged in (good!)
- You get 200 if logged in and token is sent

### 3. Inspect the token
In browser DevTools:
```javascript
// Get token from localStorage
const accounts = JSON.parse(localStorage.getItem('msal.account.keys'));
console.log(accounts);
```

Or use https://jwt.ms to decode the token and verify:
- `aud` (audience) matches your API
- `scp` (scopes) includes `access_as_user`
- `exp` (expiration) is in the future

## Additional Resources

- [Microsoft Identity Web documentation](https://learn.microsoft.com/en-us/azure/active-directory/develop/microsoft-identity-web)
- [MSAL Angular documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular)
- [Azure AD token reference](https://learn.microsoft.com/en-us/azure/active-directory/develop/access-tokens)
