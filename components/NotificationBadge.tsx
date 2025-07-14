import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  count, 
  size = 'medium', 
  style 
}) => {
  if (count === 0) return null;

  const sizeStyles = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
  };

  const textSizeStyles = {
    small: styles.smallText,
    medium: styles.mediumText,
    large: styles.largeText,
  };

  return (
    <View style={[styles.badge, sizeStyles[size], style]}>
      <Text style={[styles.badgeText, textSizeStyles[size]]}>
        {count > 99 ? '99+' : count.toString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -8,
    right: -8,
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  small: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  medium: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
  },
  large: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },
});

export default NotificationBadge; 