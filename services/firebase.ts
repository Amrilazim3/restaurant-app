// React Native Firebase configuration
// For React Native Firebase, configuration is handled through native config files
// google-services.json (Android) and GoogleService-Info.plist (iOS)

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// Export Firebase services
// No need to initialize Firebase app manually - it's done automatically through native config files
export { auth, firestore, storage };

// For backward compatibility, export as named exports matching the old structure
export const db = firestore();
export { auth as default }; 