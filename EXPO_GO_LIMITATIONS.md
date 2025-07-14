# Expo Go Limitations & Development Build Setup

## Current Issues with Expo Go

Starting with Expo SDK 53, **push notifications are not supported in Expo Go**. This affects several features in the restaurant app:

### What's Not Working in Expo Go:
- ❌ Push notifications (remote notifications)
- ❌ Background notification handling
- ❌ Expo push token generation
- ❌ Real-time order status updates via notifications

### What Still Works in Expo Go:
- ✅ Local notifications
- ✅ All core app functionality (ordering, payments, etc.)
- ✅ Basic notification UI components

## Error Messages You Might See

```
ERROR  expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53. Use a development build instead of Expo Go.

ERROR  Error getting push token: [Error: Project ID not found]
```

These errors are **normal** when using Expo Go and don't affect the app's core functionality.

## Solutions

### Option 1: Continue with Expo Go (Limited Features)
The app will work with limited notification features:
- Only local notifications will work
- No real-time push notifications
- All other features work normally

### Option 2: Set Up Development Build (Recommended)
For full functionality including push notifications:

#### Step 1: Install EAS CLI
```bash
npm install -g @expo/eas-cli
```

#### Step 2: Configure EAS Project
```bash
eas login
eas build:configure
```

#### Step 3: Update app.json
Replace `YOUR_PROJECT_ID_HERE` in `app.json` with your actual project ID:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-actual-project-id"
      }
    }
  }
}
```

#### Step 4: Build Development Build
```bash
# For Android
eas build --platform android --profile development

# For iOS
eas build --platform ios --profile development
```

#### Step 5: Install Development Build
- Download the built APK/IPA from EAS Build
- Install on your device
- Run the app with `npx expo start --dev-client`

## Firebase Configuration

To enable push notifications, you'll also need to configure Firebase:

1. Create a Firebase project at https://console.firebase.google.com/
2. Add your Android/iOS app to the project
3. Download the configuration files:
   - `google-services.json` for Android
   - `GoogleService-Info.plist` for iOS
4. Update your `app.json` with the Firebase project ID

## Testing Notifications

Once you have a development build:

1. **Test Local Notifications**: Use the "Send Test Notification" button in the app
2. **Test Push Notifications**: Place an order and check for status updates
3. **Test Background Notifications**: Close the app and trigger notifications from admin panel

## Troubleshooting

### If you still get errors after setting up development build:

1. **Check Firebase Configuration**:
   - Verify project ID is correct
   - Ensure Firebase services are enabled
   - Check if authentication is properly set up

2. **Clear Cache**:
   ```bash
   npx expo start --clear
   ```

3. **Rebuild Development Build**:
   ```bash
   eas build --platform android --profile development --clear-cache
   ```

### Common Issues:

- **"Project ID not found"**: Update the project ID in `app.json`
- **"Device not supported"**: Use a physical device, not simulator
- **"Permission denied"**: Grant notification permissions in device settings

## Development vs Production

- **Development Build**: Full features, requires EAS Build
- **Expo Go**: Limited features, quick testing
- **Production Build**: Full features, optimized for app stores

For production deployment, you'll need to create production builds using EAS Build with proper app store credentials.

## Support

- [Expo Development Builds Documentation](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Firebase Setup with Expo](https://docs.expo.dev/guides/using-firebase/) 