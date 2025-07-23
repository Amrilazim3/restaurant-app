import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { 
  Dialog, 
  YStack, 
  XStack, 
  Text, 
  Button,
  H2,
  H3
} from 'tamagui';
import { OrderStatus } from '@/types/order';

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

interface StatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: OrderStatus;
  onStatusUpdate: (status: OrderStatus) => void;
  updating: boolean;
}

export function StatusUpdateDialog({ 
  open, 
  onOpenChange, 
  currentStatus, 
  onStatusUpdate, 
  updating 
}: StatusUpdateDialogProps) {
  const getStatusColor = (status: OrderStatus) => {
    return ORDER_STATUS_COLORS[status] || '#666';
  };

  const getStatusLabel = (status: OrderStatus) => {
    return ORDER_STATUS_LABELS[status] || status;
  };

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          opacity={0.5}
          zIndex={999999}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          zIndex={1000000}
        >
          <YStack space="$4" padding="$4" minWidth={300}>
            <Dialog.Title>
              <H2>Pilih Status Baharu</H2>
            </Dialog.Title>

            <YStack space="$2">
              {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
                <Button
                  key={status}
                  variant="outlined"
                  backgroundColor={currentStatus === status ? '$gray5' : 'transparent'}
                  borderColor={getStatusColor(status as OrderStatus)}
                  onPress={() => onStatusUpdate(status as OrderStatus)}
                  disabled={updating}
                  pressStyle={{ scale: 0.98 }}
                >
                  <XStack space="$2" alignItems="center" flex={1}>
                    <Text 
                      color={getStatusColor(status as OrderStatus)}
                      fontWeight="bold"
                    >
                      {label}
                    </Text>
                    {currentStatus === status && (
                      <Text color="$gray10" fontSize="$2">(Semasa)</Text>
                    )}
                  </XStack>
                </Button>
              ))}
            </YStack>

            <XStack space="$3" justifyContent="flex-end">
              <Button
                variant="outlined"
                onPress={() => onOpenChange(false)}
                disabled={updating}
              >
                Batal
              </Button>
            </XStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
} 