import 'dotenv/config';

export default {
  expo: {
    name: "Block Twenty-9",
    slug: "restaurant-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/block-twenty-9-icon.png",
    scheme: "myapp",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/images/block-twenty-9-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.amrilazim_3.restaurantapp",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ["remote-notification"]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/block-twenty-9-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.amrilazim_3.restaurantapp"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/block-twenty-9-icon.png"
    },
    plugins: [
      [
        "onesignal-expo-plugin",
        {
          mode: "development",
          devTeam: "",
          iPhoneDeploymentTarget: "15.0"
        }
      ],
      "expo-router",
      [
        "expo-notifications",
        {
          icon: "./assets/images/block-twenty-9-icon.png",
          color: "#ffffff"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      eas: {
        projectId: "efa4027e-d369-45e7-8305-90bef77ed3bd"
      },
      firebase: {
        projectId: "retaurant-block-twenty-9"
      },
      onesignal: {
        appId: process.env.ONESIGNAL_APP_ID || "2bd08d52-0810-4f32-9ec7-ec77c432febd",
        restApiKey: process.env.ONESIGNAL_REST_API_KEY || ""
      },
      router: {}
    },
    owner: "amrilazim_3"
  }
};

