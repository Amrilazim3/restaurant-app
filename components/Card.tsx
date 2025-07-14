import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'small' | 'medium' | 'large';
  onPress?: () => void;
  disabled?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'medium',
  onPress,
  disabled = false,
}) => {
  const variantStyles = {
    default: styles.defaultCard,
    elevated: styles.elevatedCard,
    outlined: styles.outlinedCard,
    flat: styles.flatCard,
  };

  const paddingStyles = {
    none: styles.noPadding,
    small: styles.smallPadding,
    medium: styles.mediumPadding,
    large: styles.largePadding,
  };

  const cardStyle = [
    styles.card,
    variantStyles[variant],
    paddingStyles[padding],
    disabled && styles.disabledCard,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: '#fff',
    marginVertical: 4,
  },
  // Variants
  defaultCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  elevatedCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  outlinedCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowOpacity: 0,
    elevation: 0,
  },
  flatCard: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  // Padding
  noPadding: {
    padding: 0,
  },
  smallPadding: {
    padding: 8,
  },
  mediumPadding: {
    padding: 16,
  },
  largePadding: {
    padding: 24,
  },
  // States
  disabledCard: {
    opacity: 0.6,
  },
});

export default Card; 