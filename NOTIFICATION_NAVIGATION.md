# Notification Navigation Guide

## Overview

When users tap on notifications, they are automatically navigated to the appropriate screen based on the notification type and data.

## How It Works

### 1. Notification Data Structure

Each notification includes a `path` field that specifies where to navigate:

```typescript
interface NotificationData {
  orderId?: string;
  type: 'order_status' | 'payment_confirmed' | 'new_order' | 'general';
  title: string;
  message: string;
  path?: string; // Navigation path when notification is tapped
  data?: any;
}
```

### 2. Navigation Paths by Notification Type

#### Order Status Notifications
- **Path**: `/(tabs)/orders`
- **When**: Order status changes (pending, confirmed, preparing, ready, delivered, cancelled)
- **User**: Customer who placed the order

#### Payment Confirmed Notifications
- **Path**: `/order-confirmation?orderId={orderId}`
- **When**: Payment is confirmed
- **User**: Customer who made the payment

#### New Order Notifications

**For Customers:**
- **Path**: `/(tabs)/orders`
- **When**: Customer successfully creates an order
- **User**: Customer who placed the order

**For Admins:**
- **Path**: `/adminOrders`
- **When**: New order is received
- **User**: Admin users

### 3. Implementation Details

#### Notification Service (`services/notificationService.ts`)

The service automatically includes paths when creating notifications:

```typescript
const notification: NotificationData = {
  orderId: order.id,
  type: 'order_status',
  title: `Pesanan #${order.id?.slice(-8).toUpperCase()}`,
  message: statusMessages[newStatus],
  path: `/(tabs)/orders`, // Navigation path
  data: {
    orderId: order.id,
    status: newStatus,
    type: 'order_status',
    path: `/(tabs)/orders`, // Also included in data for OneSignal
  },
};
```

#### Notification Context (`contexts/NotificationContext.tsx`)

The context handles navigation when notifications are tapped:

```typescript
const handleNotificationPress = useCallback((data: any) => {
  // Priority: use path from notification data
  if (data?.path) {
    // Handle query params if path includes them
    if (data.path.includes('?')) {
      const [pathname, queryString] = data.path.split('?');
      const params: Record<string, string> = {};
      queryString.split('&').forEach((param: string) => {
        const [key, value] = param.split('=');
        if (key && value) {
          params[key] = decodeURIComponent(value);
        }
      });
      router.push({ pathname, params });
    } else {
      router.push(data.path);
    }
    return;
  }
  // Fallback logic...
}, [userProfile?.role]);
```

### 4. Supported Routes

The following routes are supported for notification navigation:

- `/(tabs)/orders` - Order list screen
- `/adminOrders` - Admin order management screen
- `/order-confirmation?orderId={id}` - Order confirmation screen
- `/qr-payment?orderId={id}` - QR payment screen (if needed)

### 5. Adding New Notification Types

To add navigation for a new notification type:

1. **Update the NotificationData interface** (if needed):
   ```typescript
   type: 'order_status' | 'payment_confirmed' | 'new_order' | 'your_new_type';
   ```

2. **Add path when creating notification**:
   ```typescript
   const notification: NotificationData = {
     // ... other fields
     path: '/your-screen-path',
     data: {
       // ... other data
       path: '/your-screen-path', // Include in data too
     },
   };
   ```

3. **Update NotificationContext** (if custom logic needed):
   ```typescript
   else if (data?.type === 'your_new_type') {
     router.push('/your-screen-path');
   }
   ```

### 6. Testing

To test notification navigation:

1. **Local Notifications**: Create an order or change order status
2. **OneSignal Push Notifications**: Ensure you have a valid API key and test on a physical device
3. **Tap the notification**: Should navigate to the appropriate screen

### 7. Query Parameters

For routes with query parameters, use this format:

```typescript
path: `/order-confirmation?orderId=${order.id}`
```

The NotificationContext automatically parses and handles query parameters.

### 8. Fallback Behavior

If a notification doesn't have a `path` field, the system falls back to:
- Checking notification `type`
- Using default routes based on type
- Admin vs user role detection for `new_order` notifications

## Example Flow

1. **Order Status Changes**:
   ```
   Order status updated → Notification sent → User taps notification → Navigates to /(tabs)/orders
   ```

2. **Payment Confirmed**:
   ```
   Payment confirmed → Notification sent → User taps notification → Navigates to /order-confirmation?orderId=xxx
   ```

3. **New Order (Admin)**:
   ```
   New order created → Admin notification sent → Admin taps notification → Navigates to /adminOrders
   ```

