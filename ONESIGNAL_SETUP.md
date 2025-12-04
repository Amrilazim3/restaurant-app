# OneSignal Setup Instructions

## Important: API Key Security

Your previous OneSignal REST API key was exposed in a public GitHub repository and has been automatically revoked by OneSignal for security reasons.

## Steps to Fix:

### 1. Generate a New REST API Key

1. Go to [OneSignal Dashboard](https://app.onesignal.com)
2. Select your app: **Block Twenty-9** (App ID: `2bd08d52-0810-4f32-9ec7-ec77c432febd`)
3. Navigate to **Settings** → **Keys & IDs**
4. Under **REST API Key**, click **Generate New Key** or copy the existing key
5. Copy the new REST API key (it will look like: `os_v2_app_...`)

### 2. Create Local Environment File

Create a `.env` file in the root of your project:

```bash
# Copy the example file
cp .env.example .env
```

Then edit `.env` and add your OneSignal credentials:

```
ONESIGNAL_APP_ID=2bd08d52-0810-4f32-9ec7-ec77c432febd
ONESIGNAL_REST_API_KEY=your_new_rest_api_key_here
```

**⚠️ IMPORTANT:** 
- Never commit the `.env` file to Git (it's already in `.gitignore`)
- Never put API keys in `app.json` or any other files that are committed to Git

### 3. For Production Builds (EAS Build)

EAS automatically makes secrets available as environment variables during builds. You have **two options**:

#### Option A: Bulk Sync from .env (Recommended) ✨

Use the provided script to sync ALL your `.env` variables to EAS Secrets at once:

```bash
npm run sync-secrets
```

This script will:
- Read all variables from your `.env` file
- Create or update EAS Secrets for each variable
- Handle multiple credentials automatically

**Example:** If your `.env` has:
```
ONESIGNAL_APP_ID=xxx
ONESIGNAL_REST_API_KEY=yyy
FIREBASE_API_KEY=zzz
STRIPE_SECRET_KEY=aaa
```

Running `npm run sync-secrets` will sync all 4 secrets to EAS automatically!

#### Option B: Manual Setup (One by One)

If you prefer to set secrets manually:

```bash
# Set individual secrets
eas secret:create --scope project --name ONESIGNAL_APP_ID --value "2bd08d52-0810-4f32-9ec7-ec77c432febd"
eas secret:create --scope project --name ONESIGNAL_REST_API_KEY --value "your_new_rest_api_key_here"
```

#### How It Works

- EAS Secrets are automatically available as environment variables during builds
- Your `app.config.js` reads from `process.env`, which EAS populates from secrets
- No need to modify `eas.json` - it's automatic!
- Secrets are encrypted and stored securely by Expo

### 4. Restart Your Development Server

After creating the `.env` file:

```bash
npm start
# or
expo start
```

## Verification

After setting up, test the notification by:
1. Creating a new order
2. Changing an order status

You should see successful push notifications without the 403 error.

## Security Best Practices

✅ **DO:**
- Use environment variables for sensitive keys
- Use `.env` for local development (already in `.gitignore`)
- Use EAS Secrets for production builds
- Keep API keys private

❌ **DON'T:**
- Commit API keys to Git
- Share API keys publicly
- Hardcode keys in source files
- Put keys in `app.json` or other config files that are committed

