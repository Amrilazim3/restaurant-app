import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionText,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {icon && (
        <Ionicons 
          name={icon} 
          size={64} 
          color="#ccc" 
          style={styles.icon}
        />
      )}
      
      <Text style={styles.title}>{title}</Text>
      
      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
      
      {actionText && onAction && (
        <Button
          title={actionText}
          onPress={onAction}
          variant="outline"
          size="medium"
          style={styles.actionButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  actionButton: {
    marginTop: 16,
  },
});

export default EmptyState; 