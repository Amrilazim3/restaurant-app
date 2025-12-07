import React, { useState, useEffect } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  Sheet, 
  YStack, 
  XStack, 
  Text, 
  Button,
  Separator,
  H2,
  H3,
  Paragraph
} from 'tamagui';
import { Order, OrderStatus } from '@/types/order';
import { authService } from '@/services/authService';
import { UserProfile } from '@/types/auth';

const ORDER_STATUS_COLORS = {
  pending: '#FF9500',
  confirmed: '#007AFF',
  preparing: '#FF9500',
  ready: '#30D158',
  delivered: '#34C759',
  cancelled: '#FF3B30',
};

const ORDER_STATUS_LABELS = {
  pending: 'Menunggu',
  confirmed: 'Disahkan',
  preparing: 'Menyediakan',
  ready: 'Siap',
  delivered: 'Dihantar',
  cancelled: 'Dibatalkan',
};

interface OrderDetailsSheetProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: () => void;
  onConfirmPayment: () => void;
  showAdminActions?: boolean;
}

export function OrderDetailsSheet({ 
  order, 
  open, 
  onOpenChange, 
  onUpdateStatus, 
  onConfirmPayment,
  showAdminActions = true
}: OrderDetailsSheetProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (order?.userId) {
        const profile = await authService.getUserProfile(order.userId);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    };

    fetchUserProfile();
  }, [order?.userId]);

  if (!order) return null;

  const getStatusColor = (status: OrderStatus) => {
    return ORDER_STATUS_COLORS[status] || '#666';
  };

  const getStatusLabel = (status: OrderStatus) => {
    return ORDER_STATUS_LABELS[status] || status;
  };

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[85, 50, 25]}
      dismissOnSnapToBottom
      zIndex={99999}
    >
      <Sheet.Overlay zIndex={99999} />
      <Sheet.Frame zIndex={99999}>
        <Sheet.Handle />
        <YStack padding="$4" space="$4">
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center">
            <H2>Butiran Pesanan</H2>
            <TouchableOpacity onPress={() => onOpenChange(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </XStack>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Order Information */}
            <YStack space="$3">
              <H3>Maklumat Pesanan</H3>
              <XStack justifyContent="space-between">
                <Text color="$gray10">ID Pesanan:</Text>
                <Text fontWeight="bold">#{order.id}</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$gray10">Status:</Text>
                <Text fontWeight="bold" color={getStatusColor(order.orderStatus)}>
                  {getStatusLabel(order.orderStatus)}
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$gray10">Masa Pesanan:</Text>
                <Text fontWeight="bold">
                  {new Date(order.createdAt).toLocaleString('ms-MY')}
                </Text>
              </XStack>
            </YStack>

            <Separator marginVertical="$3" />

            {/* Customer Information */}
            <YStack space="$3">
              <H3>Maklumat Pelanggan</H3>
              <XStack justifyContent="space-between">
                <Text color="$gray10">Nama:</Text>
                <Text fontWeight="bold">
                  {order.guestInfo 
                    ? order.guestInfo.fullName 
                    : userProfile?.displayName || 'Pelanggan Berdaftar'}
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$gray10">No. Telefon:</Text>
                <Text fontWeight="bold">{order.contactNumber}</Text>
              </XStack>
              {order.guestInfo ? (
                <XStack justifyContent="space-between">
                  <Text color="$gray10">Email:</Text>
                  <Text fontWeight="bold">{order.guestInfo.email}</Text>
                </XStack>
              ) : userProfile?.email && (
                <XStack justifyContent="space-between">
                  <Text color="$gray10">Email:</Text>
                  <Text fontWeight="bold">{userProfile.email}</Text>
                </XStack>
              )}
            </YStack>

            <Separator marginVertical="$3" />

            {/* Delivery Address */}
            <YStack space="$3">
              <H3>Alamat Penghantaran</H3>
              <Paragraph>
                {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.postalCode}
              </Paragraph>
              {order.deliveryAddress.specialInstructions && (
                <Paragraph color="$gray10" fontStyle="italic">
                  Arahan Khas: {order.deliveryAddress.specialInstructions}
                </Paragraph>
              )}
            </YStack>

            <Separator marginVertical="$3" />

            {/* Order Items */}
            <YStack space="$3">
              <H3>Item Pesanan</H3>
              {order.items.map((item, index) => (
                <XStack key={index} justifyContent="space-between" alignItems="center">
                  <XStack space="$2" flex={1}>
                    <Text fontWeight="bold">{item.quantity}x</Text>
                    <Text flex={1}>{item.foodName}</Text>
                  </XStack>
                  <Text fontWeight="bold">RM{(item.price * item.quantity).toFixed(2)}</Text>
                </XStack>
              ))}
            </YStack>

            <Separator marginVertical="$3" />

            {/* Payment Summary */}
            <YStack space="$3">
              <H3>Ringkasan Bayaran</H3>
              <XStack justifyContent="space-between">
                <Text color="$gray10">Subtotal:</Text>
                <Text>RM{order.totalAmount.toFixed(2)}</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$gray10">Yuran Penghantaran:</Text>
                <Text>RM{order.deliveryFee.toFixed(2)}</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$gray10">Cukai:</Text>
                <Text>RM{order.tax.toFixed(2)}</Text>
              </XStack>
              <Separator />
              <XStack justifyContent="space-between">
                <Text fontWeight="bold" fontSize="$5">Jumlah:</Text>
                <Text fontWeight="bold" fontSize="$5" color="$blue10">
                  RM{order.grandTotal.toFixed(2)}
                </Text>
              </XStack>
            </YStack>

            {/* Action Buttons */}
            {showAdminActions && (
              <YStack space="$3" marginTop="$4" marginBottom="$4">
                <Button
                  backgroundColor="$blue10"
                  color="white"
                  onPress={onUpdateStatus}
                  size="$5"
                >
                  Kemaskini Status
                </Button>

                {!order.paymentConfirmed && order.paymentMethod === 'qr_code' && (
                  <Button
                    backgroundColor="$green10"
                    color="white"
                    onPress={onConfirmPayment}
                    size="$4"
                  >
                    Sahkan Pembayaran
                  </Button>
                )}
              </YStack>
            )}

            <Separator marginVertical="$10" />
          </ScrollView>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
} 