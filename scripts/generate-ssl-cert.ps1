# Generate self-signed SSL certificates for local development (Windows)
# This script creates certificates that work with Angular CLI

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$CertDir = Join-Path $ProjectRoot ".certs"

Write-Host "🔐 Generating SSL certificates for local development..." -ForegroundColor Cyan

# Create .certs directory if it doesn't exist
if (-not (Test-Path $CertDir)) {
    New-Item -ItemType Directory -Path $CertDir | Out-Null
}

$CertPath = Join-Path $CertDir "localhost.pem"
$KeyPath = Join-Path $CertDir "localhost.key"

# Check if OpenSSL is available
$opensslCmd = Get-Command openssl -ErrorAction SilentlyContinue

if ($opensslCmd) {
    Write-Host "Using OpenSSL to generate certificates..." -ForegroundColor Yellow

    # Generate private key
    & openssl genrsa -out $KeyPath 2048

    # Generate certificate
    $subj = "/C=US/ST=State/L=City/O=Organization/OU=Dev/CN=localhost"
    & openssl req -new -x509 -key $KeyPath -out $CertPath -days 365 -subj $subj `
        -addext "subjectAltName=DNS:localhost,DNS:127.0.0.1,IP:127.0.0.1"

} else {
    Write-Host "OpenSSL not found. Using Windows Certificate Store..." -ForegroundColor Yellow

    # Create certificate using PowerShell (Windows 10+)
    $cert = New-SelfSignedCertificate `
        -DnsName "localhost", "127.0.0.1" `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -NotAfter (Get-Date).AddYears(1) `
        -FriendlyName "Angular Dev Certificate" `
        -KeyUsageProperty All `
        -KeyUsage CertSign, CRLSign, DigitalSignature, KeyEncipherment

    # Export certificate
    $certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
    [System.IO.File]::WriteAllBytes($CertPath, $certBytes)

    # Export private key (requires pfx export first)
    $pwd = ConvertTo-SecureString -String "temp" -Force -AsPlainText
    $pfxPath = Join-Path $CertDir "temp.pfx"
    Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $pwd | Out-Null

    # Convert PFX to PEM format using .NET
    $pfx = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($pfxPath, $pwd, [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable)
    $keyBytes = $pfx.PrivateKey.ExportPkcs8PrivateKey()
    $keyPem = "-----BEGIN PRIVATE KEY-----`n" + [Convert]::ToBase64String($keyBytes, [System.Base64FormattingOptions]::InsertLineBreaks) + "`n-----END PRIVATE KEY-----"
    [System.IO.File]::WriteAllText($KeyPath, $keyPem)

    # Clean up
    Remove-Item $pfxPath -Force
    Remove-Item "Cert:\CurrentUser\My\$($cert.Thumbprint)" -Force
}

Write-Host "✅ SSL certificates generated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Certificate location: $CertDir" -ForegroundColor Cyan
Write-Host "   - Certificate: localhost.pem"
Write-Host "   - Private Key: localhost.key"
Write-Host ""
Write-Host "⚠️  Note: Your browser will show a security warning for self-signed certificates." -ForegroundColor Yellow
Write-Host "   You can safely proceed by clicking 'Advanced' and 'Proceed to localhost'."
Write-Host ""
Write-Host "🚀 Run 'npm run start:https' to start the development server with HTTPS" -ForegroundColor Cyan
