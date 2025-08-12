# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device  
- `npm run web` - Run web version
- `npm test` - Run Jest tests with watch mode

### Building
- `eas build --platform android --profile development` - Development build for Android
- `eas build --platform android --profile preview` - Preview build for Android
- `eas build --platform android --profile production` - Production build for Android

## Architecture Overview

### Technology Stack
- **Framework**: React Native with Expo SDK 53
- **Navigation**: Expo Router (file-based routing)
- **UI Library**: Tamagui with custom configuration
- **State Management**: React Context API (AuthContext, CartContext, NotificationContext)
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Language**: TypeScript with strict mode
- **Testing**: Jest with jest-expo preset

### Project Structure
```
app/                     # File-based routing screens
├── (auth)/             # Authentication flow screens
├── (tabs)/             # Main tab navigation screens  
└── [other screens]     # Modal and stack screens

components/             # Reusable UI components
contexts/              # React contexts for global state
services/              # Firebase and API service modules
types/                 # TypeScript type definitions
constants/             # App constants and themes
assets/               # Static assets (images, fonts)
```

### Key Patterns

#### Authentication & User Roles
- Uses Firebase Auth with custom user profiles stored in Firestore
- Two user roles: 'admin' and 'user' with different app experiences
- Admin role requires special passkey during registration
- AuthContext provides user state and authentication methods globally

#### State Management
- **AuthContext**: User authentication and profile management
- **CartContext**: Shopping cart state with persistence
- **NotificationContext**: Push notifications and in-app alerts
- Contexts wrap the entire app in `app/_layout.tsx`

#### Firebase Integration
- Configuration in `services/firebase.ts` with exposed auth, db, and storage instances
- Service modules (`authService.ts`, `menuService.ts`, etc.) encapsulate Firebase operations
- Real-time listeners for order updates and notifications
- Image uploads handled through Firebase Storage with optimization

#### Navigation Structure
- File-based routing with Expo Router
- Tab navigation for main user flows: `(tabs)/_layout.tsx`
- Stack screens for modals and detail views
- Admin screens use card/modal presentation modes
- Authentication flow isolated in `(auth)/` directory

#### UI Components
- Tamagui configuration in `tamagui.config.ts` with custom animations and media queries
- Reusable components in `components/` directory
- Themed components support light/dark modes
- Custom Button, Card, LoadingSpinner, and other UI primitives

### Firebase Collections Structure
```
users/              # User profiles with role information
menus/              # Restaurant menu categories
foods/              # Individual food items linked to menus
orders/             # Customer orders with status tracking
```

### Important Configuration
- TypeScript with path mapping (`@/*` points to project root)
- EAS build profiles: development, preview, production
- Expo app configuration in `app.json` with notification settings
- Firebase project ID: "retaurant-block-twenty-9"

### Development Notes
- Push notifications require development builds (not available in Expo Go)
- Admin features are protected by role-based access control
- Image handling includes optimization and multiple format support
- Real-time updates use Firestore listeners for order status changes
- Guest checkout flow allows orders without user registration