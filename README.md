# Restaurant App

A comprehensive restaurant ordering system built with React Native and Expo.

## Features

- 🍽️ **Menu Management**: Browse and manage restaurant menu items
- 🛒 **Shopping Cart**: Add items to cart and manage quantities
- 💳 **Payment Integration**: QR code payment system
- 📱 **Order Tracking**: Real-time order status updates
- 🔔 **Notifications**: Push notifications for order updates
- 👤 **User Authentication**: Login/register system
- 👨‍💼 **Admin Panel**: Restaurant management dashboard
- 🎨 **Modern UI**: Clean and intuitive interface

## Quick Start

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn
- Expo CLI

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd restaurant-app

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running the App
1. Install Expo Go on your mobile device
2. Scan the QR code from the terminal
3. The app will load on your device

## Important: Expo Go Limitations

**⚠️ If you're getting notification errors, please read [EXPO_GO_LIMITATIONS.md](./EXPO_GO_LIMITATIONS.md)**

Starting with Expo SDK 53, push notifications don't work in Expo Go. The app will still function fully except for:
- Remote push notifications
- Background notification handling

For full functionality, you'll need to set up a development build. See the documentation above for instructions.

## Project Structure

```
├── app/                    # App screens and navigation
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   └── ...                # Other screens
├── components/            # Reusable UI components
├── contexts/              # React contexts for state management
├── services/              # API and external services
├── types/                 # TypeScript type definitions
└── constants/             # App constants and theme
```

## Key Technologies

- **React Native**: Mobile app framework
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe JavaScript
- **Firebase**: Backend services
- **Expo Router**: File-based routing
- **Context API**: State management

## Development

### Testing
```bash
# Run tests
npm test
```

### Building
```bash
# Build for development
eas build --platform android --profile development

# Build for production
eas build --platform android --profile production
```

## Features Overview

### User Features
- Browse menu items by category
- Add items to cart with customization
- Secure checkout process
- QR code payment integration
- Order history and tracking
- Profile management

### Admin Features
- Menu management (add/edit/delete items)
- Order management and status updates
- Food inventory management
- Customer management

### Technical Features
- Offline capability
- Push notifications (development build only)
- Real-time updates
- Image optimization
- Error handling and logging

## Troubleshooting

### Common Issues

1. **Notification Errors**: See [EXPO_GO_LIMITATIONS.md](./EXPO_GO_LIMITATIONS.md)
2. **Firebase Connection**: Ensure Firebase is properly configured
3. **Build Errors**: Try clearing cache with `npx expo start --clear`

### Getting Help
- Check the [EXPO_GO_LIMITATIONS.md](./EXPO_GO_LIMITATIONS.md) for notification issues
- Review the [TESTING.md](./TESTING.md) for testing guidelines
- Check the [IMAGE_SYSTEM.md](./IMAGE_SYSTEM.md) for image handling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 


## command for EAS build for android
eas build --platform android --profile preview# restaurant-app
