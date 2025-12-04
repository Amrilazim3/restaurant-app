# Environment Variables Management Guide

## Overview

This project uses environment variables for configuration. Here's how to manage them across different environments.

## Local Development

### Setup

1. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```

2. Add your credentials to `.env`:
   ```env
   ONESIGNAL_APP_ID=your_app_id
   ONESIGNAL_REST_API_KEY=your_api_key
   FIREBASE_API_KEY=your_firebase_key
   # ... add as many as you need
   ```

3. Start your dev server:
   ```bash
   npm start
   ```

The `.env` file is automatically loaded by `app.config.js` using `dotenv`.

## Production Builds (EAS)

### Option 1: Bulk Sync (Recommended) ✨

**One command syncs ALL your `.env` variables to EAS:**

```bash
npm run sync-secrets
```

This script:
- ✅ Reads all variables from your `.env` file
- ✅ Creates/updates EAS Secrets for each variable automatically
- ✅ Handles 1 variable or 100+ variables - same command!

**Example:**
If your `.env` has:
```env
ONESIGNAL_APP_ID=xxx
ONESIGNAL_REST_API_KEY=yyy
FIREBASE_API_KEY=zzz
STRIPE_SECRET_KEY=aaa
DATABASE_URL=bbb
API_ENDPOINT=ccc
```

Running `npm run sync-secrets` will sync **all 6 secrets** to EAS in one go! 🚀

### Option 2: Manual Setup

If you prefer to set secrets one by one:

```bash
eas secret:create --scope project --name ONESIGNAL_APP_ID --value "your_value"
eas secret:create --scope project --name ONESIGNAL_REST_API_KEY --value "your_value"
# ... repeat for each variable
```

### How EAS Secrets Work

- EAS Secrets are **automatically available** as environment variables during builds
- Your `app.config.js` reads from `process.env`, which EAS populates from secrets
- No need to modify `eas.json` - it's automatic!
- Secrets are encrypted and stored securely by Expo

### Viewing Your Secrets

```bash
# List all secrets
eas secret:list

# View a specific secret
eas secret:list --name ONESIGNAL_APP_ID
```

### Updating Secrets

**Option A:** Update `.env` and run `npm run sync-secrets` again

**Option B:** Update manually:
```bash
eas secret:create --scope project --name SECRET_NAME --value "new_value" --force
```

## Workflow Summary

```
┌─────────────────┐
│   Local Dev     │
│                 │
│  .env file      │
│  (gitignored)   │
└────────┬────────┘
         │
         │ npm run sync-secrets
         │
         ▼
┌─────────────────┐
│   EAS Builds    │
│                 │
│  EAS Secrets    │
│  (encrypted)    │
└─────────────────┘
```

## Best Practices

✅ **DO:**
- Keep all credentials in `.env` for local development
- Use `npm run sync-secrets` to sync to EAS before building
- Add `.env` to `.gitignore` (already done)
- Use descriptive variable names (e.g., `ONESIGNAL_REST_API_KEY`)

❌ **DON'T:**
- Commit `.env` to Git
- Hardcode secrets in source files
- Share `.env` files publicly
- Put secrets in `app.json` or other committed files

## Troubleshooting

### "Secret not found" during build
- Run `npm run sync-secrets` to sync your `.env` to EAS
- Or manually create the secret: `eas secret:create --scope project --name VARIABLE_NAME --value "value"`

### "Environment variable is undefined"
- Check that the variable name matches exactly (case-sensitive)
- Verify the secret exists: `eas secret:list`
- Restart your dev server after updating `.env`

### Need to add a new credential?
1. Add it to `.env`
2. Run `npm run sync-secrets`
3. Done! It's now available in both local dev and EAS builds

