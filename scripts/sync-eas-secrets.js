#!/usr/bin/env node

/**
 * Script to sync .env file variables to EAS Secrets
 * Usage: node scripts/sync-eas-secrets.js
 * 
 * This reads your .env file and creates/updates EAS secrets for all variables
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const envPath = path.join(__dirname, '..', '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('💡 Create a .env file in the project root first.');
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

const secrets = [];

// Parse .env file
lines.forEach((line) => {
  // Skip empty lines and comments
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return;
  }

  // Parse KEY=VALUE format
  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
    secrets.push({ key, value });
  }
});

if (secrets.length === 0) {
  console.log('⚠️  No environment variables found in .env file');
  process.exit(0);
}

console.log(`📦 Found ${secrets.length} environment variable(s) to sync\n`);

// Sync each secret to EAS
secrets.forEach(({ key, value }, index) => {
  try {
    console.log(`[${index + 1}/${secrets.length}] Syncing ${key}...`);
    
    // Create or update secret (EAS CLI handles both cases)
    // Use --force to update if it already exists
    execSync(`eas secret:create --scope project --name ${key} --value "${value}" --force`, {
      stdio: 'inherit'
    });
    console.log(`   ✅ Synced ${key}`);
  } catch (error) {
    console.error(`   ❌ Failed to sync ${key}:`, error.message);
    console.error(`   💡 Try running manually: eas secret:create --scope project --name ${key} --value "your_value"`);
  }
});

console.log('\n✨ Done! All secrets have been synced to EAS.');
console.log('💡 Tip: Run "eas secret:list" to verify all secrets are set correctly.');

