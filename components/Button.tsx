import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  ActivityIndicator,
  View 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}) => {
  const variantStyles = {
    primary: styles.primaryButton,
    secondary: styles.secondaryButton,
    outline: styles.outlineButton,
    danger: styles.dangerButton,
    success: styles.successButton,
  };

  const variantTextStyles = {
    primary: styles.primaryButtonText,
    secondary: styles.secondaryButtonText,
    outline: styles.outlineButtonText,
    danger: styles.dangerButtonText,
    success: styles.successButtonText,
  };

  const sizeStyles = {
    small: styles.smallButton,
    medium: styles.mediumButton,
    large: styles.largeButton,
  };

  const sizeTextStyles = {
    small: styles.smallButtonText,
    medium: styles.mediumButtonText,
    large: styles.largeButtonText,
  };

  const isDisabled = disabled || loading;

  const renderIcon = () => {
    if (loading) {
      return (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' ? '#007AFF' : '#fff'} 
          style={styles.loadingIcon}
        />
      );
    }

    if (icon) {
      return (
        <Ionicons 
          name={icon} 
          size={size === 'small' ? 16 : size === 'large' ? 20 : 18} 
          color={variant === 'outline' ? '#007AFF' : '#fff'}
          style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
        />
      );
    }

    return null;
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      <View style={styles.buttonContent}>
        {(icon && iconPosition === 'left') || loading ? renderIcon() : null}
        <Text 
          style={[
            styles.buttonText,
            variantTextStyles[variant],
            sizeTextStyles[size],
            isDisabled && styles.disabledButtonText,
            textStyle,
          ]}
        >
          {title}
        </Text>
        {icon && iconPosition === 'right' && !loading ? renderIcon() : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabledButton: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledButtonText: {
    opacity: 0.6,
  },
  // Variants
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  successButton: {
    backgroundColor: '#28a745',
  },
  // Variant text styles
  primaryButtonText: {
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#fff',
  },
  outlineButtonText: {
    color: '#007AFF',
  },
  dangerButtonText: {
    color: '#fff',
  },
  successButtonText: {
    color: '#fff',
  },
  // Sizes
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 32,
  },
  mediumButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  largeButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 52,
  },
  // Size text styles
  smallButtonText: {
    fontSize: 14,
  },
  mediumButtonText: {
    fontSize: 16,
  },
  largeButtonText: {
    fontSize: 18,
  },
  // Icons
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  loadingIcon: {
    marginRight: 8,
  },
});

export default Button; 