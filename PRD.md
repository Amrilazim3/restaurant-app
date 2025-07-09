# Product Requirements Document (PRD)
## Block Twenty-9 Restaurant App

### Project Overview
**App Name:** Block Twenty-9  
**Platform:** React Native with Expo  
**Backend:** Firebase  
**Target Users:** Restaurant customers and administrators  

### 1. Authentication Module

#### 1.1 User Registration
- **Features:**
  - Email and password registration
  - Name field required
  - Role selection (Admin/User) - default to User
  - Email validation
  - Password strength requirements (minimum 6 characters)
  - Duplicate email prevention

#### 1.2 User Login
- **Features:**
  - Email and password authentication
  - "Remember me" functionality
  - Password reset via email
  - Login error handling

#### 1.3 User Roles
- **Admin Role:**
  - Full access to all modules
  - Menu and food management
  - Order management
  - User management
- **User Role:**
  - Browse menus and foods
  - Place orders
  - View order history
  - Update profile

#### 1.4 Logout
- **Features:**
  - Secure logout functionality
  - Clear session data
  - Redirect to login screen

### 2. User Profile Module

#### 2.1 Profile Information
- **Display Fields:**
  - Name
  - Email
  - Phone number (optional)
  - Address (optional)
  - Profile picture (optional)

#### 2.2 Profile Management
- **Features:**
  - Edit profile information
  - Change password
  - Update profile picture
  - Save changes to Firebase

### 3. Foods and Menu Module

#### 3.1 Database Structure
```
Menu Collection:
- menuId
- name (e.g., "Drinks", "Main Course", "Desserts")
- description
- image
- isActive
- createdAt
- updatedAt

Food Collection:
- foodId
- menuId (reference to Menu)
- name
- description
- price
- image
- ingredients
- allergens
- isAvailable
- isActive
- createdAt
- updatedAt
```

#### 3.2 User Features
- **Menu Browsing:**
  - View all active menus
  - Menu categories with images
  - Menu descriptions
- **Food Browsing:**
  - View foods within each menu
  - Food details (name, description, price, image)
  - Filter by availability
  - Search functionality
- **Food Details:**
  - Detailed food information
  - Ingredients list
  - Allergen information
  - Nutritional information (optional)

#### 3.3 Admin Features
- **Menu Management:**
  - Create new menus
  - Edit existing menus
  - Delete menus (soft delete)
  - Activate/deactivate menus
- **Food Management:**
  - Add new foods to menus
  - Edit food information
  - Delete foods (soft delete)
  - Update availability status
  - Upload food images

### 4. Ordering Module

#### 4.1 Shopping Cart
- **Features:**
  - Add foods to cart
  - View cart contents
  - Update quantities
  - Remove items from cart
  - Cart total calculation
  - Persistent cart (survives app restart)

#### 4.2 Cart Management
- **Cart Item Structure:**
  - Food ID
  - Quantity
  - Price per item
  - Total price for item
  - Special instructions (optional)

### 5. Payment Module

#### 5.1 Order Confirmation
- **Required Information:**
  - Delivery address
  - Contact number
  - Special delivery instructions
  - Payment method selection

#### 5.2 Guest User Flow
- **Additional Requirements:**
  - Full name
  - Email address
  - Phone number
  - Delivery address

#### 5.3 Payment Methods
- **QR Code Payment:**
  - Display QR code for payment
  - Payment confirmation screen
  - Order status update after payment
- **Cash on Delivery:**
  - Order confirmation
  - Payment upon delivery

### 6. Order Tracking Module

#### 6.1 Order Database Structure
```
Order Collection:
- orderId
- userId (or guest info)
- items: [
  {
    foodId,
    quantity,
    price,
    specialInstructions
  }
]
- totalAmount
- deliveryAddress
- contactNumber
- paymentMethod
- orderStatus: ['pending', 'confirmed', 'preparing', 'ready', 'delivered']
- createdAt
- updatedAt
- estimatedDeliveryTime
```

#### 6.2 Customer Features
- **Order Tracking:**
  - Real-time order status updates
  - Order history
  - Estimated delivery time
  - Order details view

#### 6.3 Admin Features
- **Order Management:**
  - View new orders
  - Accept/reject orders
  - Update order status
  - Set estimated delivery time
  - Mark orders as delivered

### 7. Notification Module

#### 7.1 Push Notifications
- **Customer Notifications:**
  - Order confirmation
  - Order status updates
  - Payment confirmation
  - Delivery updates
- **Admin Notifications:**
  - New order alerts
  - Payment received notifications

#### 7.2 In-App Notifications
- **Real-time Updates:**
  - Order status changes
  - Payment confirmations
  - System announcements

### Technical Requirements

#### 8.1 Firebase Configuration
- **Authentication:**
  - Email/password authentication
  - User role management
- **Firestore Database:**
  - Collections: users, menus, foods, orders
  - Security rules for role-based access
- **Storage:**
  - Food and menu images
  - Profile pictures
- **Cloud Functions:**
  - Order processing
  - Notification sending
  - Payment verification

#### 8.2 React Native Features
- **Navigation:**
  - Stack navigation for main flows
  - Tab navigation for main sections
  - Drawer navigation for admin panel
- **State Management:**
  - Redux or Context API
  - Cart state management
  - User authentication state
- **Styling:**
  - TailwindCSS for styling
  - NativeWind for React Native integration
  - Responsive design
  - Modern, clean UI components
- **UI/UX:**
  - Modern, clean design
  - Responsive layout
  - Loading states
  - Error handling

### Development Phases

#### Phase 1: Foundation (Week 1-2) ✅ COMPLETED
- [x] Project setup with Expo
- [x] TailwindCSS/NativeWind configuration
- [x] Firebase configuration
- [x] Authentication module
- [x] Basic navigation structure

#### Phase 2: Core Features (Week 3-4)
- [ ] User profile module
- [ ] Menu and food browsing
- [ ] Shopping cart functionality
- [ ] Basic admin panel

#### Phase 3: Ordering System (Week 5-6)
- [ ] Order placement
- [ ] Payment module
- [ ] Guest user flow
- [ ] Order confirmation

#### Phase 4: Admin Features (Week 7-8)
- [ ] Menu and food management
- [ ] Order management
- [ ] Order tracking system
- [ ] Admin dashboard

#### Phase 5: Notifications & Polish (Week 9-10)
- [ ] Push notifications
- [ ] Real-time updates
- [ ] UI/UX improvements
- [ ] Testing and bug fixes

### Success Metrics
- User registration and retention
- Order completion rate
- Admin order processing time
- App performance and stability
- User satisfaction ratings

### Future Enhancements
- Loyalty program
- Reviews and ratings
- Multiple restaurant locations
- Advanced analytics dashboard
- Integration with real payment gateways
- Delivery tracking with maps
- Social media integration 