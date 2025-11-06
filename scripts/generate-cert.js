// generate-cert.js
// Usage:
//   node scripts/generate-cert.js
//   DEV_HOSTS="app.dev.local api.dev.local" node scripts/generate-cert.js
//   node scripts/generate-cert.js app.dev.local api.dev.local
//
// What it does:
//   - Requires mkcert (trusted local CA) https://github.com/FiloSottile/mkcert
//   - Installs the local CA (mkcert -install) if needed
//   - Generates certs at ./certs/localhost.pem and ./certs/localhost-key.pem
//   - Hosts covered: localhost, 127.0.0.1, ::1 + any extra provided
//
// Notes:
//   - Intentionally NO self-signed fallback by default (untrusted). To allow
//     a temp self-signed fallback set ALLOW_SELFSIGNED=1 (not recommended).

const fs = require("fs");
const path = require("path");
const { execFileSync, execSync } = require("child_process");

const projectRoot = path.join(__dirname, "..");
const certsDir = path.join(projectRoot, "certs");
const legacyDir = path.join(projectRoot, ".certs"); // migrate from old layout
const certFile = path.join(certsDir, "localhost.pem");
const keyFile = path.join(certsDir, "localhost-key.pem");

// Build host list: default + DEV_HOSTS env + CLI args
const defaultHosts = ["localhost", "127.0.0.1", "::1"];
const envHosts = (process.env.DEV_HOSTS || "")
  .split(/\s+/)
  .map(h => h.trim())
  .filter(Boolean);
const argHosts = process.argv.slice(2).map(h => h.trim()).filter(Boolean);
const hosts = Array.from(new Set([...defaultHosts, ...envHosts, ...argHosts]));

// Ensure output dir exists
fs.mkdirSync(certsDir, { recursive: true });

// One-time migration from legacy ".certs" (previous script layout)
try {
  const legacyCert = path.join(legacyDir, "localhost.crt");
  const legacyKey = path.join(legacyDir, "localhost.key");
  if (!fs.existsSync(certFile) && fs.existsSync(legacyCert)) {
    fs.copyFileSync(legacyCert, certFile);
  }
  if (!fs.existsSync(keyFile) && fs.existsSync(legacyKey)) {
    fs.copyFileSync(legacyKey, keyFile);
  }
} catch (_) {
  // ignore
}

// If both cert and key already exist, we're done.
if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
  console.log("✅ Trusted dev certs already exist at ./certs");
  console.log(`   cert: ${path.relative(projectRoot, certFile)}`);
  console.log(`   key : ${path.relative(projectRoot, keyFile)}`);
  process.exit(0);
}

// Helper: check mkcert availability
function hasMkcert() {
  try {
    const out = execSync(process.platform === "win32" ? "where mkcert" : "which mkcert", {
      stdio: ["ignore", "pipe", "ignore"],
    }).toString();
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

const mkcertAvailable = hasMkcert();

if (!mkcertAvailable) {
  const allowSelfSigned = process.env.ALLOW_SELFSIGNED === "1";
  console.error("❌ mkcert not found on PATH.");
  if (!allowSelfSigned) {
    console.error(
      "   Please install mkcert (recommended) so the cert is trusted by your OS/browser:\n" +
      "   • macOS:  brew install mkcert nss\n" +
      "   • Windows (Scoop): scoop install mkcert\n" +
      "   • Windows (Chocolatey): choco install mkcert\n" +
      "   • Linux: see mkcert README for your distro\n\n" +
      "   Or set ALLOW_SELFSIGNED=1 to generate an untrusted self-signed cert (not recommended)."
    );
    process.exit(1);
  }
}

// Generate via mkcert (trusted) or fallback (self-signed)
try {
  if (mkcertAvailable) {
    console.log("🔐 Installing/ensuring local CA (mkcert -install)...");
    execFileSync("mkcert", ["-install"], { stdio: "inherit" });

    console.log("🔐 Generating trusted development certificate with mkcert...");
    // mkcert supports explicit output paths via -cert-file / -key-file
    const args = [
      "-key-file", keyFile,
      "-cert-file", certFile,
      ...hosts,
    ];
    execFileSync("mkcert", args, { stdio: "inherit" });

    // Basic sanity check
    if (!fs.existsSync(certFile) || !fs.existsSync(keyFile)) {
      throw new Error("mkcert completed but files were not created.");
    }

    console.log("✅ Trusted certificates created:");
    console.log(`   cert: ${path.relative(projectRoot, certFile)}`);
    console.log(`   key : ${path.relative(projectRoot, keyFile)}`);
    console.log("\nNext steps:");
    console.log("  • Run Angular dev server over HTTPS:");
    console.log("      ng serve --ssl --ssl-cert ./certs/localhost.pem --ssl-key ./certs/localhost-key.pem");
    console.log("  • If proxying to a self-signed API, set secure:false in your proxy config (dev-only).");
  } else {
    // Optional, not recommended path:
    console.warn("⚠️  Falling back to a self-signed certificate (UNTRUSTED).");
    console.warn("    Set up mkcert for a trusted experience.");
    // Minimal self-signed generation using OpenSSL if present, else selfsigned npm
    try {
      execSync(
        `openssl req -x509 -newkey rsa:2048 -nodes -keyout "${keyFile}" -out "${certFile}" -days 365 -subj "/CN=localhost"`,
        { stdio: "inherit" }
      );
    } catch {
      const selfsigned = require("selfsigned");
      const pems = selfsigned.generate([{ name: "commonName", value: "localhost" }], { days: 365 });
      fs.writeFileSync(keyFile, pems.private);
      fs.writeFileSync(certFile, pems.cert);
    }
    console.log("✅ Self-signed certs created (not trusted by default):");
    console.log(`   cert: ${path.relative(projectRoot, certFile)}`);
    console.log(`   key : ${path.relative(projectRoot, keyFile)}`);
    console.log("\nStrongly recommended: install mkcert and re-run this script.");
  }
} catch (err) {
  console.error("❌ Failed to generate certificates:", err?.message || err);
  process.exit(1);
}
